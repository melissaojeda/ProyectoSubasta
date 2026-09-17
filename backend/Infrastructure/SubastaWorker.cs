using Domain.Entities;
using Infrastructure.Datos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using Infrastructure.Hubs;

namespace Infrastructure
{
    public class SubastaWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SubastaWorker> _logger;
        private readonly IHubContext<SubastaHub> _hubContext;
        public SubastaWorker(IServiceProvider serviceProvider, ILogger<SubastaWorker> logger, IHubContext<SubastaHub> hubContext)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
            _hubContext = hubContext;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("SubastaWorker iniciado. Monitoreando subastas vencidas...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcesarSubastasVencidasAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al procesar el cierre automático de subastas.");
                }

                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        private async Task ProcesarSubastasVencidasAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var ahora = DateTime.UtcNow;

            //PASO DE PROGRAMADA -> ACTIVA
            var subastasParaActivar = await context.Set<Subasta>()
                .Where(s => s.Estado == "PROGRAMADA" && s.FechaInicio <= ahora)
                .ToListAsync();

            if (subastasParaActivar.Any())
            {
                foreach (var subasta in subastasParaActivar)
                {
                    subasta.Estado = "ACTIVA";
                    subasta.Version++;

                    context.AuditoriasLog.Add(new AuditoriaLog
                    {
                        Entidad = "Subasta",
                        EntidadId = subasta.Id,
                        Accion = "CAMBIO_ESTADO",
                        UsuarioId = null,
                        DetalleJson = $"{{\"mensaje\": \"Subasta #{subasta.Id} activada automáticamente. Estado cambiado de PROGRAMADA a ACTIVA.\"}}",
                        Fecha = DateTime.UtcNow
                    });

                    _logger.LogInformation($"Subasta #{subasta.Id} ha sido ACTIVADA automáticamente.");
                }
                await context.SaveChangesAsync();
            }
            //PASO DE ACTIVA -> DESIERTA / FINALIZADA
            var subastasVencidas = await context.Set<Subasta>()
                .Include(s => s.Pujas)
                .Where(s => s.Estado == "ACTIVA" && s.FechaFin <= ahora)
                .ToListAsync();

            if (!subastasVencidas.Any()) return;

            foreach (var subasta in subastasVencidas)
            {
                using var transaction = await context.Database.BeginTransactionAsync();
                try
                {
                    var pujaGanadora = subasta.Pujas.OrderByDescending(p => p.Monto).FirstOrDefault();

                    if (pujaGanadora == null)
                    {
                        // CASO 1: Sin ofertas -> Estado DESIERTA
                        subasta.Estado = "DESIERTA";
                        subasta.Version++;
                        
                        context.AuditoriasLog.Add(new AuditoriaLog
                        {
                            Entidad = "Subasta",
                            EntidadId = subasta.Id,
                            Accion = "CAMBIO_ESTADO",
                            UsuarioId = null,
                            DetalleJson = $"{{\"mensaje\": \"Subasta #{subasta.Id} finalizó sin ofertas. Estado cambiado a DESIERTA.\"}}",
                            Fecha = DateTime.UtcNow
                        });

                        _logger.LogInformation($"Subasta #{subasta.Id} finalizada sin ofertas (DESIERTA).");

                        await context.SaveChangesAsync();
                        await transaction.CommitAsync();

                        // NOTIFICACIÓN EN TIEMPO REAL VÍA SIGNALR
                        await _hubContext.Clients.Group(subasta.Id.ToString())
                            .SendAsync("SubastaFinalizada", new 
                            { 
                                SubastaId = subasta.Id, 
                                Estado = "DESIERTA" 
                            });
                    }
                    else
                    {
                        // CASO 2: Con ganador -> Estado FINALIZADA y liquidación de fondos
                        subasta.Estado = "FINALIZADA";
                        subasta.Version++;

                        var billeteraComprador = await context.Set<Billetera>()
                            .FirstOrDefaultAsync(b => b.UsuarioId == pujaGanadora.CompradorId);

                        var billeteraVendedor = await context.Set<Billetera>()
                            .FirstOrDefaultAsync(b => b.UsuarioId == subasta.VendedorId);

                        // Validación de existencia de billeteras
                        if (billeteraComprador == null)
                        {
                            throw new InvalidOperationException("No se encontró la billetera del comprador ganador.");
                        }

                        if (billeteraVendedor == null)
                        {
                            throw new InvalidOperationException("No se encontró la billetera del vendedor.");
                        }
                        if (billeteraComprador.SaldoRetenido < pujaGanadora.Monto)
                        {
                            throw new InvalidOperationException("El saldo retenido del comprador no alcanza para liquidar la subasta.");
                        }

                        billeteraComprador.SaldoRetenido -= pujaGanadora.Monto;
                        billeteraComprador.SaldoTotal -= pujaGanadora.Monto;
                        billeteraComprador.Version ++;

                        billeteraVendedor.SaldoDisponible += pujaGanadora.Monto;
                        billeteraVendedor.SaldoTotal += pujaGanadora.Monto;
                        billeteraVendedor.Version++;

                        // Registro de transacciones en el ledger
                        context.Set<TransaccionLedger>().Add(new TransaccionLedger
                        {
                            BilleteraId = billeteraComprador.Id,
                            Tipo = "PAGO_SUBASTA",
                            Monto = pujaGanadora.Monto,
                            Fecha = DateTime.UtcNow,
                            SubastaId = subasta.Id
                        });

                        context.Set<TransaccionLedger>().Add(new TransaccionLedger
                        {
                            BilleteraId = billeteraVendedor.Id,
                            Tipo = "INGRESO_VENTA",
                            Monto = pujaGanadora.Monto,
                            Fecha = DateTime.UtcNow,
                            SubastaId = subasta.Id
                        });

                        context.AuditoriasLog.Add(new AuditoriaLog
                        {
                            Entidad = "Subasta",
                            EntidadId = subasta.Id,
                            Accion = "CAMBIO_ESTADO",
                            UsuarioId = pujaGanadora.CompradorId,
                            DetalleJson = $"{{\"mensaje\": \"Subasta #{subasta.Id} FINALIZADA por Worker.\", \"ganadorId\": {pujaGanadora.CompradorId}, \"monto\": {pujaGanadora.Monto}}}",
                            Fecha = DateTime.UtcNow
                        });

                        _logger.LogInformation($"Subasta #{subasta.Id} FINALIZADA. Ganador: Usuario #{pujaGanadora.CompradorId}.");
                        await context.SaveChangesAsync();
                        await transaction.CommitAsync();
                        // NOTIFICACIÓN EN TIEMPO REAL VÍA SIGNALR
                        await _hubContext.Clients.Group(subasta.Id.ToString())
                            .SendAsync("SubastaFinalizada", new 
                            { 
                                SubastaId = subasta.Id, 
                                Estado = "FINALIZADA",
                                GanadorId = pujaGanadora.CompradorId,
                                MontoFinal = pujaGanadora.Monto
                            });
                    }

                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, $"Error procesando el cierre de la subasta #{subasta.Id}");
                }
            }
        }
    }
}