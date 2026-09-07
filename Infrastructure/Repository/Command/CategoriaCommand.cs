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
    public class CategoriaCommand : ICategoriaCommand
    {
        private readonly AppDbContext _context;

        public CategoriaCommand(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(Categoria categoria)
        {
            await _context.Categorias.AddAsync(categoria);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Categoria categoria)
        {
            _context.Categorias.Update(categoria);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Categoria categoria)
        {
            _context.Categorias.Remove(categoria);
            await _context.SaveChangesAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}