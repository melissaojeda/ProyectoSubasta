using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Usuario;
using Application.IRepository.ICommand;
using Domain.Entities;
using Infrastructure.Datos;

namespace Infrastructure.Repository.Command
{
    public class UsuarioCommand : IUsuarioCommand
    {
        private readonly AppDbContext _context;

        public UsuarioCommand(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(CreateUsuarioDTO dto)
        {
            var usuario = new Usuario
            {
                Nombre = dto.Nombre,
                Apellido = dto.Apellido,
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            var billetera = new Billetera
            {
                Usuario = usuario,
                SaldoTotal = 0,
                SaldoDisponible = 0,
                SaldoRetenido = 0,
                Version = 0
            };

            await _context.Usuarios.AddAsync(usuario);
            await _context.Billeteras.AddAsync(billetera);

            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(UpdateUsuarioDTO dto)
        {
            var usuario = await _context.Usuarios.FindAsync(dto.Id);

            if (usuario == null) return;

            usuario.Nombre = dto.Nombre;
            usuario.Apellido = dto.Apellido;
            usuario.Email = dto.Email;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Usuario usuario)
        {
            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}