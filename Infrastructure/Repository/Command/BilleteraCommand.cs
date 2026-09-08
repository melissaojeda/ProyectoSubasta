using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Billetera;
using Application.IRepository.ICommand;
using Domain.Entities;
using Infrastructure.Datos;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository.Command
{
    public class BilleteraCommand : IBilleteraCommand
    {
        private readonly AppDbContext _context;

        public BilleteraCommand(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(Billetera billetera)
        {
            await _context.Billeteras.AddAsync(billetera);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Billetera billetera)
        {
            _context.Billeteras.Update(billetera);
            await _context.SaveChangesAsync();
        }
        public async Task DepositarAsync(int usuarioId, decimal monto)
        {
            if (monto <= 0)
                throw new ArgumentException("El monto a depositar debe ser mayor a cero.");

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var billetera = await _context.Billeteras
                    .FirstOrDefaultAsync(b => b.UsuarioId == usuarioId);

                if (billetera == null)
                    throw new Exception("No se encontró una billetera para el usuario especificado.");

                billetera.SaldoDisponible += monto;
                _context.Billeteras.Update(billetera);

                _context.AuditoriasLog.Add(new AuditoriaLog
                {
                    Entidad = "Billetera",
                    EntidadId = billetera.Id,
                    Accion = "DEPOSITO_FONDOS",
                    UsuarioId = usuarioId,
                    DetalleJson = $"{{\"MontoDepositado\": {monto}, \"NuevoSaldoDisponible\": {billetera.SaldoDisponible}}}",
                    Fecha = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}