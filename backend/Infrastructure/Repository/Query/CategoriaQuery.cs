using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Categoria;
using Application.IRepository.IQuery;
using Infrastructure.Datos;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository.Query
{
    public class CategoriaQuery : ICategoriaQuery
    {
        private readonly AppDbContext _context;

        public CategoriaQuery(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GetCategoriaDTO?> GetByIdAsync(int id)
        {
            return await _context.Categorias
                .AsNoTracking()
                .Where(c => c.Id == id)
                .Select(c => new GetCategoriaDTO
                {
                    Id = c.Id,
                    Nombre = c.Nombre,
                    IconoUrl = c.IconoUrl
                })
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<GetCategoriaDTO>> GetAllAsync()
        {
            return await _context.Categorias
                .AsNoTracking()
                .Select(c => new GetCategoriaDTO
                {
                    Id = c.Id,
                    Nombre = c.Nombre,
                    IconoUrl = c.IconoUrl
                })
                .ToListAsync();
        }
    }
}