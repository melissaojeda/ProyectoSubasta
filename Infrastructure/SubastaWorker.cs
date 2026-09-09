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
                    var ultimaPuja = subasta.Pujas.OrderByDescending(p => p.Monto).FirstOrDefault();

                    if (ultimaPuja == null)
                    {
                        // CASO 1: Sin ofertas -> Estado DESIERTA
                        subasta.Estado = "DESIERTA";

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

                        var billeteraComprador = await context.Set<Billetera>()
                            .FirstOrDefaultAsync(b => b.UsuarioId == ultimaPuja.CompradorId);

                        var billeteraVendedor = await context.Set<Billetera>()
                            .FirstOrDefaultAsync(b => b.UsuarioId == subasta.VendedorId);

                        if (billeteraComprador != null && billeteraVendedor != null)
                        {
                            billeteraComprador.SaldoRetenido -= ultimaPuja.Monto;
                            billeteraComprador.SaldoTotal -= ultimaPuja.Monto;

                            billeteraVendedor.SaldoDisponible += ultimaPuja.Monto;
                            billeteraVendedor.SaldoTotal += ultimaPuja.Monto;

                            context.Set<TransaccionLedger>().Add(new TransaccionLedger
                            {
                                BilleteraId = billeteraVendedor.Id,
                                Tipo = "INGRESO_VENTA",
                                Monto = ultimaPuja.Monto,
                                Fecha = DateTime.UtcNow,
                                SubastaId = subasta.Id
                            });
                        }

                        context.Set<AuditoriaLog>().Add(new AuditoriaLog
                        {
                            Entidad = "Subasta",
                            EntidadId = subasta.Id,
                            Accion = "CAMBIO_ESTADO",
                            UsuarioId = ultimaPuja.CompradorId,
                            DetalleJson = $"{{\"mensaje\": \"Subasta #{subasta.Id} FINALIZADA por Worker.\", \"ganadorId\": {ultimaPuja.CompradorId}, \"monto\": {ultimaPuja.Monto}}}",
                            Fecha = DateTime.UtcNow
                        });

                        _logger.LogInformation($"Subasta #{subasta.Id} FINALIZADA. Ganador: Usuario #{ultimaPuja.CompradorId}.");
                    }

                    await context.SaveChangesAsync();
                    await transaction.CommitAsync();
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