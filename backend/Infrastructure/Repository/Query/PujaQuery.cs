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

        public async Task<IEnumerable<GetPujaDTO>> GetByUsuarioIdAsync(int usuarioId)
        {
            return await _context.Pujas
                .AsNoTracking()
                .Where(p => p.CompradorId == usuarioId)
                .OrderByDescending(p => p.FechaPuja)
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

        public async Task<IEnumerable<GetActividadPujaDTO>> GetActividadesByUsuarioIdAsync(int usuarioId)
        {
            return await _context.Subastas
                .AsNoTracking()
                .Where(s => s.Pujas.Any(p => p.CompradorId == usuarioId))
                .OrderByDescending(s => s.FechaFin)
                .Select(s => new GetActividadPujaDTO
                {
                    SubastaId = s.Id,
                    TituloSubasta = s.Titulo,
                    EstadoSubasta = s.Estado,

                    MejorPuja = s.Pujas.Max(p => p.Monto),

                    MiMejorPuja = s.Pujas
                        .Where(p => p.CompradorId == usuarioId)
                        .Max(p => p.Monto),

                    EsGanador = s.Estado == "FINALIZADA"
                        ? (bool?)(s.Pujas
                            .OrderByDescending(p => p.Monto)
                            .Select(p => p.CompradorId)
                            .FirstOrDefault() == usuarioId)
                        : null
                })
                .ToListAsync();
        }
    }
}