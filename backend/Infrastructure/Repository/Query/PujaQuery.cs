using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Puja;
using Application.IRepository.IQuery;
using Infrastructure.Datos;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository.Query
{
    public class PujaQuery : IPujaQuery
    {
        private readonly AppDbContext _context;

        public PujaQuery(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GetPujaDTO?> GetByIdAndSubastaIdAsync(int subastaId, int id)
        {
            return await _context.Pujas
                .AsNoTracking()
                .Where(p => p.Id == id && p.SubastaId == subastaId)
                .Select(p => new GetPujaDTO
                {
                    Id = p.Id,
                    SubastaId = p.SubastaId,
                    NombreComprador = p.Comprador.Nombre + " " + p.Comprador.Apellido,
                    Monto = p.Monto,
                    FechaPuja = p.FechaPuja
                })
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<GetPujaDTO>> GetBySubastaIdAsync(int subastaId)
        {
            return await _context.Pujas
                .AsNoTracking()
                .Where(p => p.SubastaId == subastaId)
                .Select(p => new GetPujaDTO
                {
                    Id = p.Id,
                    SubastaId = p.SubastaId,
                    NombreComprador = p.Comprador.Nombre + " " + p.Comprador.Apellido,
                    Monto = p.Monto,
                    FechaPuja = p.FechaPuja
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<GetPujaDTO>> GetByUsuarioAndSubastaIdAsync(int subastaId, int usuarioId)
        {
            return await _context.Pujas
                .AsNoTracking()
                .Where(p => p.CompradorId == usuarioId && p.SubastaId == subastaId)
                .Select(p => new GetPujaDTO
                {
                    Id = p.Id,
                    SubastaId = p.SubastaId,
                    NombreComprador = p.Comprador.Nombre + " " + p.Comprador.Apellido,
                    Monto = p.Monto,
                    FechaPuja = p.FechaPuja
                })
                .ToListAsync();
        }
    }
}