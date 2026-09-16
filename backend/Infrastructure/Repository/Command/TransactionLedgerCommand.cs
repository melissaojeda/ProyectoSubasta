using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.IRepository.ICommand;
using Domain.Entities;
using Infrastructure.Datos;

namespace Infrastructure.Repository.Command
{
    public class TransaccionLedgerCommand : ITransaccionLedgerCommand
    {
        private readonly AppDbContext _context;

        public TransaccionLedgerCommand(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(TransaccionLedger transaccion)
        {
            await _context.TransaccionesLedger.AddAsync(transaccion);
            await _context.SaveChangesAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}