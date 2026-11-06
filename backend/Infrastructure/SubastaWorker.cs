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

        public SubastaWorker(
            IServiceProvider serviceProvider,
            ILogger<SubastaWorker> logger,
            IHubContext<SubastaHub> hubContext)
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

                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }
        }

        private async Task ProcesarSubastasVencidasAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var ahora = DateTime.UtcNow;

            // PROGRAMADA -> ACTIVA
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

                    _logger.LogInformation("Subasta #{SubastaId} activada automaticamente.", subasta.Id);
                }

                // Nunca avisar antes de que el nuevo estado exista en BD.
                await context.SaveChangesAsync();

                foreach (var subasta in subastasParaActivar)
                {
                    try
                    {
                        await _hubContext.Clients.All
                            .SendAsync("SubastaActivada", new
                            {
                                SubastaId = subasta.Id,
                                Estado = "ACTIVA",
                                FechaInicio = subasta.FechaInicio
                            });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex,
                            "Se activo la subasta #{SubastaId}, pero fallo la notificacion SignalR.",
                            subasta.Id);
                    }
                }
            }

            // ACTIVA -> DESIERTA / FINALIZADA. Solo se comparten IDs entre iteraciones:
            // los datos monetarios de una subasta nunca quedan en el contexto de otra.
            var idsSubastasVencidas = await context.Set<Subasta>()
                .AsNoTracking()
                .Where(s => s.Estado == "ACTIVA" && s.FechaFin <= ahora)
                .Select(s => s.Id)
                .ToListAsync();

            foreach (var subastaId in idsSubastasVencidas)
            {
                using var scopeCierre = _serviceProvider.CreateScope();
                var contextCierre = scopeCierre.ServiceProvider.GetRequiredService<AppDbContext>();

                // Se vuelve a comprobar el estado y el vencimiento porque una puja
                // pudo extender la subasta desde que se consultaron los IDs.
                var subasta = await contextCierre.Set<Subasta>()
                    .Include(s => s.Pujas)
                    .FirstOrDefaultAsync(s => s.Id == subastaId
                        && s.Estado == "ACTIVA"
                        && s.FechaFin <= DateTime.UtcNow);

                if (subasta == null)
                    continue;

                object? eventoConfirmado = null;
                bool commitConfirmado = false;
                await using var transaction = await contextCierre.Database.BeginTransactionAsync();

                try
                {
                    var pujaGanadora = subasta.Pujas
                        .OrderByDescending(p => p.Monto)
                        .FirstOrDefault();

                    if (pujaGanadora == null)
                    {
                        subasta.Estado = "DESIERTA";
                        subasta.Version++;

                        contextCierre.AuditoriasLog.Add(new AuditoriaLog
                        {
                            Entidad = "Subasta",
                            EntidadId = subasta.Id,
                            Accion = "CAMBIO_ESTADO",
                            UsuarioId = null,
                            DetalleJson = $"{{\"mensaje\": \"Subasta #{subasta.Id} finalizó sin ofertas. Estado cambiado a DESIERTA.\"}}",
                            Fecha = DateTime.UtcNow
                        });

                        await contextCierre.SaveChangesAsync();
                        await transaction.CommitAsync();
                        commitConfirmado = true;

                        eventoConfirmado = new
                        {
                            SubastaId = subasta.Id,
                            Estado = "DESIERTA"
                        };

                        _logger.LogInformation("Subasta #{SubastaId} finalizada sin ofertas.", subasta.Id);
                    }
                    else
                    {
                        subasta.Estado = "FINALIZADA";
                        subasta.Version++;

                        var billeteraComprador = await contextCierre.Set<Billetera>()
                            .FirstOrDefaultAsync(b => b.UsuarioId == pujaGanadora.CompradorId);
                        var billeteraVendedor = await contextCierre.Set<Billetera>()
                            .FirstOrDefaultAsync(b => b.UsuarioId == subasta.VendedorId);

                        if (billeteraComprador == null)
                            throw new InvalidOperationException("No se encontró la billetera del comprador ganador.");
                        if (billeteraVendedor == null)
                            throw new InvalidOperationException("No se encontró la billetera del vendedor.");
                        if (billeteraComprador.SaldoRetenido < pujaGanadora.Monto)
                            throw new InvalidOperationException("El saldo retenido del comprador no alcanza para liquidar la subasta.");

                        billeteraComprador.SaldoRetenido -= pujaGanadora.Monto;
                        billeteraComprador.SaldoTotal -= pujaGanadora.Monto;
                        billeteraComprador.Version++;

                        billeteraVendedor.SaldoDisponible += pujaGanadora.Monto;
                        billeteraVendedor.SaldoTotal += pujaGanadora.Monto;
                        billeteraVendedor.Version++;

                        contextCierre.Set<TransaccionLedger>().Add(new TransaccionLedger
                        {
                            BilleteraId = billeteraComprador.Id,
                            Tipo = "PAGO_SUBASTA",
                            Monto = pujaGanadora.Monto,
                            Fecha = DateTime.UtcNow,
                            SubastaId = subasta.Id
                        });

                        contextCierre.Set<TransaccionLedger>().Add(new TransaccionLedger
                        {
                            BilleteraId = billeteraVendedor.Id,
                            Tipo = "INGRESO_VENTA",
                            Monto = pujaGanadora.Monto,
                            Fecha = DateTime.UtcNow,
                            SubastaId = subasta.Id
                        });

                        contextCierre.AuditoriasLog.Add(new AuditoriaLog
                        {
                            Entidad = "Subasta",
                            EntidadId = subasta.Id,
                            Accion = "CAMBIO_ESTADO",
                            UsuarioId = pujaGanadora.CompradorId,
                            DetalleJson = $"{{\"mensaje\": \"Subasta #{subasta.Id} FINALIZADA por Worker.\", \"ganadorId\": {pujaGanadora.CompradorId}, \"monto\": {pujaGanadora.Monto}}}",
                            Fecha = DateTime.UtcNow
                        });

                        await contextCierre.SaveChangesAsync();
                        await transaction.CommitAsync();
                        commitConfirmado = true;

                        eventoConfirmado = new
                        {
                            SubastaId = subasta.Id,
                            Estado = "FINALIZADA",
                            MontoFinal = pujaGanadora.Monto
                        };

                        _logger.LogInformation("Subasta #{SubastaId} finalizada. Ganador: #{GanadorId}.",
                            subasta.Id, pujaGanadora.CompradorId);
                    }
                }
                catch (Exception ex)
                {
                    // La transaccion pudo fallar o ya estar cerrandose. Si el
                    // rollback tambien falla, conservamos el error original.
                    if (!commitConfirmado)
                    {
                        try
                        {
                            await transaction.RollbackAsync();
                        }
                        catch (Exception rollbackEx)
                        {
                            _logger.LogError(rollbackEx,
                                "Error intentando revertir la subasta #{SubastaId}.", subasta.Id);
                        }
                    }

                    _logger.LogError(ex, "Error procesando el cierre de la subasta #{SubastaId}.",
                        subasta.Id);
                }

                // Canal de notificaciones fuera de la transaccion economica:
                // si SignalR falla, nunca se deshace un cierre ya confirmado.
                if (eventoConfirmado != null)
                {
                    try
                    {
                        await _hubContext.Clients.All
                            .SendAsync("SubastaFinalizada", eventoConfirmado);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex,
                            "La subasta #{SubastaId} se cerro, pero fallo la notificacion SignalR.",
                            subasta.Id);
                    }
                }
            }
        }
    }
}
