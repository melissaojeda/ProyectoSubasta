using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Subasta;
using Application.IRepository.IQuery;
using Infrastructure.Datos;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository.Query
{
    public class SubastaQuery : ISubastaQuery
    {
        private readonly AppDbContext _context;

        public SubastaQuery(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GetSubastaDTO?> GetByIdAsync(int id)
        {
            return await _context.Subastas
                .AsNoTracking()
                .Where(s => s.Id == id)
                .Select(s => new GetSubastaDTO
                {
                    Id = s.Id,
                    Titulo = s.Titulo,
                    Descripcion = s.Descripcion,
                    UrlImagen = s.UrlImagen,
                    PrecioBase = s.PrecioBase,
                    IncrementoMinimo = s.IncrementoMinimo,
                    FechaInicio = s.FechaInicio,
                    FechaFin = s.FechaFin,
                    Estado = s.Estado,
                    NombreVendedor = s.Vendedor.Nombre + " " + s.Vendedor.Apellido,
                    NombreCategoria = s.Categoria.Nombre,
                    MejorPuja = s.Pujas.Any() ? s.Pujas.Max(p => p.Monto) : 0,
                    CantidadPujas = s.Pujas.Count()
                })
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<GetSubastaDTO>> GetAllAsync()
        {
            return await _context.Subastas
                .AsNoTracking()
                .Select(s => new GetSubastaDTO
                {
                    Id = s.Id,
                    Titulo = s.Titulo,
                    Descripcion = s.Descripcion,
                    UrlImagen = s.UrlImagen,
                    PrecioBase = s.PrecioBase,
                    IncrementoMinimo = s.IncrementoMinimo,
                    FechaInicio = s.FechaInicio,
                    FechaFin = s.FechaFin,
                    Estado = s.Estado,
                    NombreVendedor = s.Vendedor.Nombre + " " + s.Vendedor.Apellido,
                    NombreCategoria = s.Categoria.Nombre,
                    MejorPuja = s.Pujas.Any() ? s.Pujas.Max(p => p.Monto) : 0,
                    CantidadPujas = s.Pujas.Count()
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<GetSubastaDTO>> GetByEstadoAsync(string estado)
        {
            return await _context.Subastas
                .AsNoTracking()
                .Where(s => s.Estado == estado)
                .Select(s => new GetSubastaDTO
                {
                    Id = s.Id,
                    Titulo = s.Titulo,
                    Descripcion = s.Descripcion,
                    UrlImagen = s.UrlImagen,
                    PrecioBase = s.PrecioBase,
                    IncrementoMinimo = s.IncrementoMinimo,
                    FechaInicio = s.FechaInicio,
                    FechaFin = s.FechaFin,
                    Estado = s.Estado,
                    NombreVendedor = s.Vendedor.Nombre + " " + s.Vendedor.Apellido,
                    NombreCategoria = s.Categoria.Nombre,
                    MejorPuja = s.Pujas.Any() ? s.Pujas.Max(p => p.Monto) : 0,
                    CantidadPujas = s.Pujas.Count()
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<GetSubastaDTO>> GetByCategoriaAsync(int categoriaId)
        {
            return await _context.Subastas
                .AsNoTracking()
                .Where(s => s.CategoriaId == categoriaId)
                .Select(s => new GetSubastaDTO
                {
                    Id = s.Id,
                    Titulo = s.Titulo,
                    Descripcion = s.Descripcion,
                    UrlImagen = s.UrlImagen,
                    PrecioBase = s.PrecioBase,
                    IncrementoMinimo = s.IncrementoMinimo,
                    FechaInicio = s.FechaInicio,
                    FechaFin = s.FechaFin,
                    Estado = s.Estado,
                    NombreVendedor = s.Vendedor.Nombre + " " + s.Vendedor.Apellido,
                    NombreCategoria = s.Categoria.Nombre,
                    MejorPuja = s.Pujas.Any() ? s.Pujas.Max(p => p.Monto) : 0,
                    CantidadPujas = s.Pujas.Count()
                })
                .ToListAsync();
        }
    }
}