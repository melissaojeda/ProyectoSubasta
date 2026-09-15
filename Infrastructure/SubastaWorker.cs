using Domain.Entities;
using Infrastructure.Datos;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure
{
    public class SubastaWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SubastaWorker> _logger;

        public SubastaWorker(IServiceProvider serviceProvider, ILogger<SubastaWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Monitoreando el ciclo de vida de subastas...");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ActivarSubastasProgramadasAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al procesar la activación automática de subastas.");
                }

                try
                {
                    await ProcesarsubastasVencidasIdsAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al procesar el cierre automático de subastas.");
                }

                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
            }
        }

        // Cambios de estado con un Scope aislado para manejar cada subasta
        private async Task ActivarSubastasProgramadasAsync()
        {
            List<int> subastasProgramadasIds;

            // Contexto para buscar subastas programadas por su ID
            using (var scopeConsulta = _serviceProvider.CreateScope())
            {
                var contextConsulta = scopeConsulta.ServiceProvider.GetRequiredService<AppDbContext>();

                var ahora = DateTime.UtcNow;

                subastasProgramadasIds = await contextConsulta.Set<Subasta>()
                    .AsNoTracking()
                    .Where(s => s.Estado == "PROGRAMADA" && s.FechaInicio <= ahora)
                    .Select(s => s.Id)
                    .ToListAsync();
            }

            foreach (var subastaId in subastasProgramadasIds)
            {
                using var scope = _serviceProvider.CreateScope();

                // Contexto para cambiar el estado de la subasta
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                try
                {
                    var ahora = DateTime.UtcNow;

                    var subasta = await context.Set<Subasta>()
                        .FirstOrDefaultAsync(s =>
                            s.Id == subastaId &&
                            s.Estado == "PROGRAMADA" &&
                            s.FechaInicio <= ahora);

                    if (subasta == null) continue;

                    subasta.Estado = "ACTIVA";
                    subasta.Version++;

                    context.Set<AuditoriaLog>().Add(new AuditoriaLog
                    {
                        Entidad = "Subasta",
                        EntidadId = subasta.Id,
                        Accion = "CAMBIO_ESTADO",
                        UsuarioId = null,
                        DetalleJson = $"{{\"mensaje\": \"Subasta #{subasta.Id} cambió de PROGRAMADA a ACTIVA automáticamente.\"}}",
                        Fecha = DateTime.UtcNow
                    });

                    await context.SaveChangesAsync();

                    _logger.LogInformation($"Subasta #{subasta.Id} activada automáticamente.");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Error al activar automáticamente la subasta #{subastaId}.");
                }
            }
        }


        private async Task ProcesarsubastasVencidasIdsAsync()
        {
            List<int> subastasVencidasIds;

            //Contexto para buscar subastas activas por su ID
            using (var scopeConsulta = _serviceProvider.CreateScope()) 
            {
                var contextConsulta = scopeConsulta.ServiceProvider.GetRequiredService<AppDbContext>();

                var ahora = DateTime.UtcNow;

                subastasVencidasIds = await contextConsulta.Set<Subasta>()
                    .AsNoTracking()
                    .Where(s => s.Estado == "ACTIVA" && s.FechaFin <= ahora)
                    .Select(s => s.Id)
                    .ToListAsync();
            }

            if (!subastasVencidasIds.Any()) return;

            foreach (var subastaId in subastasVencidasIds)
            {
                using var scope = _serviceProvider.CreateScope();

                // Contexto para cambiar el estado de la subasta
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                using var transaction = await context.Database.BeginTransactionAsync();

                try
                {
                    var ahora = DateTime.UtcNow;

                    var subasta = await context.Set<Subasta>()
                        .Include(s => s.Pujas)
                        .FirstOrDefaultAsync(s => s.Id == subastaId && s.Estado == "ACTIVA" && s.FechaFin <= ahora);

                    if(subasta == null)
                    {
                        await transaction.RollbackAsync();
                        continue;
                    }

                    var pujaGanadora = subasta.Pujas.OrderByDescending(p => p.Monto).FirstOrDefault();

                    if (pujaGanadora == null)
                    {
                        // CASO 1: Sin ofertas -> Estado DESIERTA
                        subasta.Estado = "DESIERTA";
                        subasta.Version++;

                        context.Set<AuditoriaLog>().Add(new AuditoriaLog
                        {
                            Entidad = "Subasta",
                            EntidadId = subasta.Id,
                            Accion = "CAMBIO_ESTADO",
                            UsuarioId = null,
                            DetalleJson = $"{{\"mensaje\": \"Subasta #{subasta.Id} finalizó sin ofertas. Estado cambiado a DESIERTA.\"}}",
                            Fecha = DateTime.UtcNow
                        });

                        _logger.LogInformation($"Subasta #{subasta.Id} finalizada sin ofertas (DESIERTA).");
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
                            throw new InvalidOperationException(
                                "No se encontró la billetera del comprador ganador.");
                        }

                        if (billeteraVendedor == null)
                        {
                            throw new InvalidOperationException(
                                "No se encontró la billetera del vendedor.");
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
                        
                        context.Set<AuditoriaLog>().Add(new AuditoriaLog
                        {
                            Entidad = "Subasta",
                            EntidadId = subasta.Id,
                            Accion = "CAMBIO_ESTADO",
                            UsuarioId = pujaGanadora.CompradorId,
                            DetalleJson = $"{{\"mensaje\": \"Subasta #{subasta.Id} FINALIZADA por Worker.\", \"ganadorId\": {pujaGanadora.CompradorId}, \"monto\": {pujaGanadora.Monto}}}",
                            Fecha = DateTime.UtcNow
                        });

                        _logger.LogInformation($"Subasta #{subasta.Id} FINALIZADA. Ganador: Usuario #{pujaGanadora.CompradorId}.");
                    }

                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, $"Error procesando el cambio de estado de la subasta #{subastaId}");
                }
            }
        }

       
    }
}