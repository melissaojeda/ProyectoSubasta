using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Puja;
using Application.IRepository.ICommand;
using Domain.Entities;
using Infrastructure.Datos;

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
            var puja = new Puja
            {
                SubastaId = dto.SubastaId,
                CompradorId = dto.CompradorId,
                Monto = dto.Monto,
                FechaPuja = DateTime.UtcNow
            };

            await _context.Pujas.AddAsync(puja);
            await _context.SaveChangesAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}