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
            //Validaciones previas antes de iniciar transacciones de dinero
            var subasta = await _context.Subastas
                .FirstOrDefaultAsync(s => s.Id == subastaId);

            if (subasta == null)
                throw new ArgumentException("La subasta no existe.");

            if (DateTime.UtcNow > subasta.FechaFin)
                throw new InvalidOperationException("La subasta ya ha finalizado.");

            //Validar que la subasta esté activa
            if (subasta.Estado != "ACTIVA")
            {
                throw new InvalidOperationException(
                    "La subasta no se encuentra activa.");
            }

            var pujaMaximaActual = await _context.Pujas
                .Where(p => p.SubastaId == subastaId)
                .OrderByDescending(p => p.Monto)
                .FirstOrDefaultAsync();

            // Validar que el monto de la puja sea mayor al mínimo requerido
            decimal precioMinimoRequerido = pujaMaximaActual != null 
                ? pujaMaximaActual.Monto + subasta.IncrementoMinimo
                : subasta.PrecioBase;

            if (dto.Monto < precioMinimoRequerido)
                throw new ArgumentException($"El monto debe ser superior o igual al valor mínimo requerido (${precioMinimoRequerido}).");

            var billeteraNuevoPostor = await _context.Billeteras
                .FirstOrDefaultAsync(b => b.UsuarioId == dto.CompradorId);

            if (billeteraNuevoPostor == null)
                throw new ArgumentException("El comprador no posee una billetera activa.");


            // Calcular el monto necesario a retener en la billetera del postor
            decimal montoNecesario = dto.Monto;

            if (pujaMaximaActual != null &&
                pujaMaximaActual.CompradorId == dto.CompradorId)
            {
                montoNecesario = dto.Monto - pujaMaximaActual.Monto;
            }

            // Validar saldo disponible suficiente
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

                throw new InvalidOperationException("Saldo insuficiente en la billetera para realizar la oferta.");
            }

            // Transacción de base de datos para movimientos de fondos y registro de puja
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Devolución de Escrow al postor anterior
                if (pujaMaximaActual != null)
                {
                    var billeteraAnteriorPostor = (pujaMaximaActual.CompradorId == dto.CompradorId)
                        ? billeteraNuevoPostor
                        : await _context.Billeteras.FirstOrDefaultAsync(b => b.UsuarioId == pujaMaximaActual.CompradorId);

                    if (billeteraAnteriorPostor != null)
                    {
                        billeteraAnteriorPostor.SaldoRetenido -= pujaMaximaActual.Monto;
                        billeteraAnteriorPostor.SaldoDisponible += pujaMaximaActual.Monto;
                        billeteraAnteriorPostor.Version++; // Incrementar la versión para control de concurrencia
                        _context.Billeteras.Update(billeteraAnteriorPostor);

                        // Registrar liberación del saldo retenido
                        _context.TransaccionesLedger.Add(new TransaccionLedger
                        {
                            BilleteraId = billeteraAnteriorPostor.Id,
                            SubastaId = subasta.Id,
                            Tipo = "LIBERACION_PUJA",
                            Monto = pujaMaximaActual.Monto,
                            Fecha = DateTime.UtcNow
                        });
                    }
                }

                // Retener fondos en la billetera del nuevo postor
                billeteraNuevoPostor.SaldoDisponible -= dto.Monto;
                billeteraNuevoPostor.SaldoRetenido += dto.Monto;
                billeteraNuevoPostor.Version++; // Incrementar la versión para control de concurrencia
                _context.Billeteras.Update(billeteraNuevoPostor);

                // Registrar retención de la nueva puja
                _context.TransaccionesLedger.Add(new TransaccionLedger
                {
                    BilleteraId = billeteraNuevoPostor.Id,
                    SubastaId = subasta.Id,
                    Tipo = "RETENCION_PUJA",
                    Monto = dto.Monto,
                    Fecha = DateTime.UtcNow
                });

                // Aplicar Anti Sniping
                var tiempoRestante = subasta.FechaFin - DateTime.UtcNow;
                if (tiempoRestante.TotalSeconds <= 60 && tiempoRestante.TotalSeconds > 0)
                {
                    subasta.FechaFin = subasta.FechaFin.AddMinutes(2);

                    _context.AuditoriasLog.Add(new AuditoriaLog
                    {
                        Entidad = "Subasta",
                        EntidadId = subasta.Id,
                        Accion = "ANTI_SNIPING_DISPARADO",
                        UsuarioId = dto.CompradorId,
                        DetalleJson = $"{{\"NuevaFechaFin\": \"{subasta.FechaFin:o}\"}}",
                        Fecha = DateTime.UtcNow
                    });
                }

                // Actualizar la versión de subasta con la nueva puja
                subasta.Version++;
                _context.Subastas.Update(subasta);

                // Registrar la nueva Puja
                var nuevaPuja = new Puja
                {
                    SubastaId = subasta.Id,
                    CompradorId = dto.CompradorId,
                    Monto = dto.Monto,
                    FechaPuja = DateTime.UtcNow
                };

                await _context.Pujas.AddAsync(nuevaPuja);

                // Confirmar la puja completa
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
                    DetalleJson = $"{{\"mensaje\": \"Conflicto de concurrencia detectado al procesar la puja por ${dto.Monto}\"}}",
                    Fecha = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                throw new DbUpdateConcurrencyException("La puja no se pudo completar debido a una actualización concurrente. Por favor, intente de nuevo.", ex);
            }
            catch
            {
                if (transaction.TransactionId != Guid.Empty)
                {
                    try { await transaction.RollbackAsync(); } catch { }
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