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

        public async Task CreateAsync(CreatePujaDTO dto)
        {
            //Validaciones previas antes de iniciar transacciones de dinero
            var subasta = await _context.Subastas
                .FirstOrDefaultAsync(s => s.Id == dto.SubastaId);

            if (subasta == null)
                throw new ArgumentException("La subasta no existe.");

            if (DateTime.UtcNow > subasta.FechaFin)
                throw new InvalidOperationException("La subasta ya ha finalizado.");

            var pujaMaximaActual = await _context.Pujas
                .Where(p => p.SubastaId == dto.SubastaId)
                .OrderByDescending(p => p.Monto)
                .FirstOrDefaultAsync();

            decimal precioMinimoRequerido = pujaMaximaActual != null 
                ? pujaMaximaActual.Monto 
                : subasta.PrecioBase;

            if (dto.Monto <= precioMinimoRequerido)
                throw new ArgumentException($"El monto debe ser superior al valor actual (${precioMinimoRequerido}).");

            var billeteraNuevoPostor = await _context.Billeteras
                .FirstOrDefaultAsync(b => b.UsuarioId == dto.CompradorId);

            if (billeteraNuevoPostor == null)
                throw new ArgumentException("El comprador no posee una billetera activa.");

            // Validar saldo disponible suficiente
            if (billeteraNuevoPostor.SaldoDisponible < dto.Monto)
            {
                _context.AuditoriasLog.Add(new AuditoriaLog
                {
                    Entidad = "Puja",
                    EntidadId = dto.SubastaId,
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
                        _context.Billeteras.Update(billeteraAnteriorPostor);
                    }
                }

                // Retener fondos en la billetera del nuevo postor
                billeteraNuevoPostor.SaldoDisponible -= dto.Monto;
                billeteraNuevoPostor.SaldoRetenido += dto.Monto;
                _context.Billeteras.Update(billeteraNuevoPostor);

                // Aplicar Anti Sniping
                var tiempoRestante = subasta.FechaFin - DateTime.UtcNow;
                if (tiempoRestante.TotalSeconds <= 60 && tiempoRestante.TotalSeconds > 0)
                {
                    subasta.FechaFin = subasta.FechaFin.AddMinutes(2);
                    _context.Subastas.Update(subasta);

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

                // Registrar la nueva Puja
                var nuevaPuja = new Puja
                {
                    SubastaId = dto.SubastaId,
                    CompradorId = dto.CompradorId,
                    Monto = dto.Monto,
                    FechaPuja = DateTime.UtcNow
                };

                await _context.Pujas.AddAsync(nuevaPuja);

                // Confirmar la transacción completa
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
                    EntidadId = dto.SubastaId,
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