using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Subasta;
using Application.IRepository.ICommand;
using Domain.Entities;
using Infrastructure.Datos;

namespace Infrastructure.Repository.Command
{
    public class SubastaCommand : ISubastaCommand
    {
        private readonly AppDbContext _context;

        public SubastaCommand(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(CreateSubastaDTO dto)
        {
            var subasta = new Subasta
            {
                VendedorId = dto.VendedorId,
                CategoriaId = dto.CategoriaId,
                Titulo = dto.Titulo.Trim(),
                Descripcion = dto.Descripcion.Trim(),
                UrlImagen = dto.UrlImagen.Trim(),
                PrecioBase = dto.PrecioBase,
                IncrementoMinimo = dto.IncrementoMinimo,
                FechaInicio = dto.FechaInicio,
                FechaFin = dto.FechaFin
            };

            await _context.Subastas.AddAsync(subasta);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Subasta subasta)
        {
            _context.Subastas.Update(subasta);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Subasta subasta)
        {
            _context.Subastas.Remove(subasta);
            await _context.SaveChangesAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}