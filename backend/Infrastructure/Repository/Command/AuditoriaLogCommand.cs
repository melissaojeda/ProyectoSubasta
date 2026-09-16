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
    public class AuditoriaLogCommand : IAuditoriaLogCommand
    {
        private readonly AppDbContext _context;

        public AuditoriaLogCommand(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(AuditoriaLog log)
        {
            await _context.AuditoriasLog.AddAsync(log);
            await _context.SaveChangesAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}