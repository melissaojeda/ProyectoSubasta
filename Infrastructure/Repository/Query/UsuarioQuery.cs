using Application.DTOs.Usuario;
using Application.IRepository.IQuery;
using Infrastructure.Datos;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Repository.Query
{
    public class UsuarioQuery : IUsuarioQuery
    {
        private readonly AppDbContext _context;

        public UsuarioQuery(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GetUsuarioDTO?> GetByIdAsync(int id)
        {
            return await _context.Usuarios
                .AsNoTracking()
                .Where(u => u.Id == id)
                .Select(u => new GetUsuarioDTO
                {
                    Id = u.Id,
                    Nombre = u.Nombre,
                    Apellido = u.Apellido,
                    Email = u.Email
                })
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<GetUsuarioDTO>> GetAllAsync()
        {
            return await _context.Usuarios
                .AsNoTracking()
                .Select(u => new GetUsuarioDTO
                {
                    Id = u.Id,
                    Nombre = u.Nombre,
                    Apellido = u.Apellido,
                    Email = u.Email
                })
                .ToListAsync();
        }
    }
}