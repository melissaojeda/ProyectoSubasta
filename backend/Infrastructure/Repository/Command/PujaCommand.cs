using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Puja;
using Application.IRepository.ICommand;
using Domain.Entities;
using Infrastructure.Datos;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository.Command
{
    public class PujaCommand : IPujaCommand
    {
        private readonly AppDbContext _context;

        public PujaCommand(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(int subastaId, CreatePujaDTO dto)
        {
            // Validaciones previas antes de iniciar transacciones de dinero
            var subasta = await _context.Subastas
                .FirstOrDefaultAsync(s => s.Id == subastaId);

            if (subasta == null)
                throw new ArgumentException("La subasta no existe.");

            if (subasta.VendedorId == dto.CompradorId)
            {
                _context.AuditoriasLog.Add(new AuditoriaLog
                {
                    Entidad = "Puja",
                    EntidadId = subastaId,
                    Accion = "RECHAZADA_VENDEDOR",
                    UsuarioId = dto.CompradorId,
                    DetalleJson =
                        $"{{\"MontoIntentado\": {dto.Monto}, \"mensaje\": \"El vendedor intentó pujar en su propia subasta.\"}}",
                    Fecha = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                throw new InvalidOperationException(
                    "El dueño de la subasta no puede pujar por ella.");
            }

            if (dto.Monto > 99_999_999.99m)
            {
                throw new ArgumentException(
                    "La puja no puede superar $99.999.999,99.");
            }

            if (DateTime.UtcNow > subasta.FechaFin)
            {
                _context.AuditoriasLog.Add(new AuditoriaLog
                {
                    Entidad = "Puja",
                    EntidadId = subastaId,
                    Accion = "RECHAZADA_SUBASTA_FINALIZADA",
                    UsuarioId = dto.CompradorId,
                    DetalleJson = $"{{\"MontoIntentado\": {dto.Monto}, \"mensaje\": \"La subasta ya ha finalizado.\"}}",
                    Fecha = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                throw new InvalidOperationException("La subasta ya ha finalizado.");
            }

            if (subasta.Estado != "ACTIVA")
            {
                _context.AuditoriasLog.Add(new AuditoriaLog
                {
                    Entidad = "Puja",
                    EntidadId = subastaId,
                    Accion = "RECHAZADA_SUBASTA_NO_ACTIVA",
                    UsuarioId = dto.CompradorId,
                    DetalleJson = $"{{\"MontoIntentado\": {dto.Monto}, \"EstadoSubasta\": \"{subasta.Estado}\"}}",
                    Fecha = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                throw new InvalidOperationException("La subasta no se encuentra activa.");
            }

            var pujaMaximaActual = await _context.Pujas
                .Where(p => p.SubastaId == subastaId)
                .OrderByDescending(p => p.Monto)
                .FirstOrDefaultAsync();

            decimal precioMinimoRequerido = pujaMaximaActual != null
                ? pujaMaximaActual.Monto + subasta.IncrementoMinimo
                : subasta.PrecioBase;

            if (dto.Monto < precioMinimoRequerido)
            {
                _context.AuditoriasLog.Add(new AuditoriaLog
                {
                    Entidad = "Puja",
                    EntidadId = subastaId,
                    Accion = "RECHAZADA_MONTO_INSUFICIENTE",
                    UsuarioId = dto.CompradorId,
                    DetalleJson = $"{{\"MontoIntentado\": {dto.Monto}, \"MontoMinimoRequerido\": {precioMinimoRequerido}}}",
                    Fecha = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                throw new ArgumentException(
                    $"El monto debe ser superior o igual al valor mínimo requerido (${precioMinimoRequerido}).");
            }

            var billeteraNuevoPostor = await _context.Billeteras
                .FirstOrDefaultAsync(b => b.UsuarioId == dto.CompradorId);

            if (billeteraNuevoPostor == null)
                throw new ArgumentException("El comprador no posee una billetera activa.");

            decimal montoNecesario = dto.Monto;

            if (pujaMaximaActual != null &&
                pujaMaximaActual.CompradorId == dto.CompradorId)
            {
                montoNecesario = dto.Monto - pujaMaximaActual.Monto;
            }

            if (billeteraNuevoPostor.SaldoDisponible < montoNecesario)
            {
                _context.AuditoriasLog.Add(new AuditoriaLog
                {
                    Entidad = "Puja",
                    EntidadId = subastaId,
                    Accion = "RECHAZADA_FONDOS_INSUFICIENTES",
                    UsuarioId = dto.CompradorId,
                    DetalleJson = $"{{\"MontoIntentado\": {dto.Monto}, \"SaldoDisponible\": {billeteraNuevoPostor.SaldoDisponible}}}",
                    Fecha = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                throw new InvalidOperationException(
                    "Saldo insuficiente en la billetera para realizar la oferta.");
            }

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                if (pujaMaximaActual != null)
                {
                    var billeteraAnteriorPostor =
                        pujaMaximaActual.CompradorId == dto.CompradorId
                            ? billeteraNuevoPostor
                            : await _context.Billeteras
                                .FirstOrDefaultAsync(
                                    b => b.UsuarioId == pujaMaximaActual.CompradorId);

                    if (billeteraAnteriorPostor == null)
                    {
                        throw new KeyNotFoundException(
                            "No se encontró la billetera del postor anterior.");
                    }

                    billeteraAnteriorPostor.SaldoRetenido -= pujaMaximaActual.Monto;
                    billeteraAnteriorPostor.SaldoDisponible += pujaMaximaActual.Monto;
                    billeteraAnteriorPostor.Version++;

                    _context.Billeteras.Update(billeteraAnteriorPostor);

                    _context.TransaccionesLedger.Add(new TransaccionLedger
                    {
                        BilleteraId = billeteraAnteriorPostor.Id,
                        SubastaId = subasta.Id,
                        Tipo = "LIBERACION_PUJA",
                        Monto = pujaMaximaActual.Monto,
                        Fecha = DateTime.UtcNow
                    });
                }

                billeteraNuevoPostor.SaldoDisponible -= dto.Monto;
                billeteraNuevoPostor.SaldoRetenido += dto.Monto;
                billeteraNuevoPostor.Version++;

                _context.Billeteras.Update(billeteraNuevoPostor);

                _context.TransaccionesLedger.Add(new TransaccionLedger
                {
                    BilleteraId = billeteraNuevoPostor.Id,
                    SubastaId = subasta.Id,
                    Tipo = "RETENCION_PUJA",
                    Monto = dto.Monto,
                    Fecha = DateTime.UtcNow
                });

                var tiempoRestante = subasta.FechaFin - DateTime.UtcNow;

                if (tiempoRestante.TotalSeconds <= 60 &&
                    tiempoRestante.TotalSeconds > 0)
                {
                    subasta.FechaFin = subasta.FechaFin.AddMinutes(2);

                    _context.AuditoriasLog.Add(new AuditoriaLog
                    {
                        Entidad = "Subasta",
                        EntidadId = subasta.Id,
                        Accion = "ANTI_SNIPING_DISPARADO",
                        UsuarioId = dto.CompradorId,
                        DetalleJson =
                            $"{{\"NuevaFechaFin\": \"{subasta.FechaFin:o}\"}}",
                        Fecha = DateTime.UtcNow
                    });
                }

                subasta.Version++;

                _context.Subastas.Update(subasta);

                var nuevaPuja = new Puja
                {
                    SubastaId = subasta.Id,
                    CompradorId = dto.CompradorId,
                    Monto = dto.Monto,
                    FechaPuja = DateTime.UtcNow
                };

                await _context.Pujas.AddAsync(nuevaPuja);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                await transaction.RollbackAsync();
                _context.ChangeTracker.Clear();

                _context.AuditoriasLog.Add(new AuditoriaLog
                {
                    Entidad = "Puja",
                    EntidadId = subastaId,
                    Accion = "RECHAZADA_CONCURRENCIA",
                    UsuarioId = dto.CompradorId,
                    DetalleJson =
                        $"{{\"mensaje\": \"Conflicto de concurrencia detectado al procesar la puja por ${dto.Monto}\"}}",
                    Fecha = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();

                throw new DbUpdateConcurrencyException(
                    "La puja no se pudo completar debido a una actualización concurrente. Por favor, intente de nuevo.",
                    ex);
            }
            catch
            {
                if (transaction.TransactionId != Guid.Empty)
                {
                    try
                    {
                        await transaction.RollbackAsync();
                    }
                    catch
                    {
                    }
                }

                throw;
            }
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}