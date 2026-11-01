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

        public async Task CreateAsync(int subastaId, CreatePujaDTO dto,
            int versionSubastaEsperada, int versionBilleteraEsperada,
            DateTime? nuevaFechaFin)
        {
            // Todos los movimientos de la puja deben confirmarse o revertirse juntos.
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var subasta = await _context.Subastas
                    .FirstOrDefaultAsync(s => s.Id == subastaId);
                if (subasta == null)
                    throw new DbUpdateConcurrencyException(
                        "La subasta dejó de estar disponible durante la puja.");

                var billeteraNuevoPostor = await _context.Billeteras
                    .FirstOrDefaultAsync(b => b.UsuarioId == dto.CompradorId);
                if (billeteraNuevoPostor == null)
                    throw new DbUpdateConcurrencyException(
                        "La billetera dejó de estar disponible durante la puja.");

                // Las reglas se validaron en Application: estas versiones deben seguir vigentes.
                if (subasta.Version != versionSubastaEsperada ||
                    billeteraNuevoPostor.Version != versionBilleteraEsperada)
                    throw new DbUpdateConcurrencyException(
                        "Los datos cambiaron mientras se procesaba la puja.");

                var pujaMaximaActual = await _context.Pujas
                    .Where(p => p.SubastaId == subastaId)
                    .OrderByDescending(p => p.Monto)
                    .FirstOrDefaultAsync();

                if (pujaMaximaActual != null)
                    await LiberarPujaAnteriorAsync(
                        pujaMaximaActual, billeteraNuevoPostor, subastaId);

                RegistrarRetencionNuevaPuja(
                    billeteraNuevoPostor, subastaId, dto.Monto);

                PersistirProrroga(subasta, dto.CompradorId, nuevaFechaFin);

                subasta.Version++;
                _context.Subastas.Update(subasta);

                await _context.Pujas.AddAsync(new Puja
                {
                    SubastaId = subasta.Id,
                    CompradorId = dto.CompradorId,
                    Monto = dto.Monto,
                    FechaPuja = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                await transaction.RollbackAsync();
                _context.ChangeTracker.Clear();

                // El rechazo debe auditarse después del rollback, fuera de la transacción fallida.
                await transaction.DisposeAsync();

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
                await transaction.RollbackAsync();
                _context.ChangeTracker.Clear();
                throw;
            }
        }

        private async Task LiberarPujaAnteriorAsync(
            Puja pujaMaximaActual, Billetera billeteraNuevoPostor, int subastaId)
        {
            var billeteraAnteriorPostor =
                pujaMaximaActual.CompradorId == billeteraNuevoPostor.UsuarioId
                    ? billeteraNuevoPostor
                    : await _context.Billeteras.FirstOrDefaultAsync(
                        b => b.UsuarioId == pujaMaximaActual.CompradorId);

            if (billeteraAnteriorPostor == null)
                throw new KeyNotFoundException(
                    "No se encontró la billetera del postor anterior.");

            billeteraAnteriorPostor.SaldoRetenido -= pujaMaximaActual.Monto;
            billeteraAnteriorPostor.SaldoDisponible += pujaMaximaActual.Monto;
            billeteraAnteriorPostor.Version++;
            _context.Billeteras.Update(billeteraAnteriorPostor);

            _context.TransaccionesLedger.Add(new TransaccionLedger
            {
                BilleteraId = billeteraAnteriorPostor.Id,
                SubastaId = subastaId,
                Tipo = "LIBERACION_PUJA",
                Monto = pujaMaximaActual.Monto,
                Fecha = DateTime.UtcNow
            });
        }

        private void RegistrarRetencionNuevaPuja(
            Billetera billeteraNuevoPostor, int subastaId, decimal monto)
        {
            billeteraNuevoPostor.SaldoDisponible -= monto;
            billeteraNuevoPostor.SaldoRetenido += monto;
            billeteraNuevoPostor.Version++;
            _context.Billeteras.Update(billeteraNuevoPostor);

            _context.TransaccionesLedger.Add(new TransaccionLedger
            {
                BilleteraId = billeteraNuevoPostor.Id,
                SubastaId = subastaId,
                Tipo = "RETENCION_PUJA",
                Monto = monto,
                Fecha = DateTime.UtcNow
            });
        }

        private void PersistirProrroga(
            Subasta subasta, int compradorId, DateTime? nuevaFechaFin)
        {
            if (!nuevaFechaFin.HasValue)
                return;

            // Application decide cuándo extender; Infrastructure solo guarda la decisión.
            subasta.FechaFin = nuevaFechaFin.Value;
            _context.AuditoriasLog.Add(new AuditoriaLog
            {
                Entidad = "Subasta",
                EntidadId = subasta.Id,
                Accion = "ANTI_SNIPING_DISPARADO",
                UsuarioId = compradorId,
                DetalleJson = $"{{\"NuevaFechaFin\": \"{subasta.FechaFin:o}\"}}",
                Fecha = DateTime.UtcNow
            });
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}