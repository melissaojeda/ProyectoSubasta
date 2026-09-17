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
                    Email = u.Email,
                    FechaRegistro = u.FechaRegistro
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
                    Email = u.Email,
                    FechaRegistro = u.FechaRegistro
                })
                .ToListAsync();
        }

        public async Task<GetUsuarioDTO?> LoginAsync(
            string email,
            string password)
        {
            var emailNormalizado = email.Trim().ToLower();

            var usuario = await _context.Usuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalizado);

            if (usuario == null)
            {
                return null;
            }

            if (!BCrypt.Net.BCrypt.Verify(password, usuario.PasswordHash))
            {
                return null;
            }

            return new GetUsuarioDTO
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Apellido = usuario.Apellido,
                Email = usuario.Email,
                FechaRegistro = usuario.FechaRegistro
            };
        }
    }
}