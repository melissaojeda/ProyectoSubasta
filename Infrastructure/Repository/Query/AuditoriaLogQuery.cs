using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.AuditoriaLog;
using Application.IRepository.IQuery;
using Infrastructure.Datos;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository.Query
{
    public class AuditoriaLogQuery : IAuditoriaLogQuery
    {
        private readonly AppDbContext _context;

        public AuditoriaLogQuery(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GetAuditoriaLogDTO?> GetByIdAsync(int id)
        {
            return await _context.AuditoriasLog
                .AsNoTracking()
                .Where(a => a.Id == id)
                .Select(a => new GetAuditoriaLogDTO
                {
                    Id = a.Id,
                    Entidad = a.Entidad,
                    EntidadId = a.EntidadId,
                    Accion = a.Accion,
                    UsuarioId = a.UsuarioId,
                    DetalleJson = a.DetalleJson,
                    Fecha = a.Fecha
                })
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<GetAuditoriaLogDTO>> GetAllAsync()
        {
            return await _context.AuditoriasLog
                .AsNoTracking()
                .Select(a => new GetAuditoriaLogDTO
                {
                    Id = a.Id,
                    Entidad = a.Entidad,
                    EntidadId = a.EntidadId,
                    Accion = a.Accion,
                    UsuarioId = a.UsuarioId,
                    DetalleJson = a.DetalleJson,
                    Fecha = a.Fecha
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<GetAuditoriaLogDTO>> GetByEntidadAsync(string entidad)
        {
            return await _context.AuditoriasLog
                .AsNoTracking()
                .Where(a => a.Entidad == entidad)
                .Select(a => new GetAuditoriaLogDTO
                {
                    Id = a.Id,
                    Entidad = a.Entidad,
                    EntidadId = a.EntidadId,
                    Accion = a.Accion,
                    UsuarioId = a.UsuarioId,
                    DetalleJson = a.DetalleJson,
                    Fecha = a.Fecha
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<GetAuditoriaLogDTO>> GetByUsuarioIdAsync(int usuarioId)
        {
            return await _context.AuditoriasLog
                .AsNoTracking()
                .Where(a => a.UsuarioId == usuarioId)
                .Select(a => new GetAuditoriaLogDTO
                {
                    Id = a.Id,
                    Entidad = a.Entidad,
                    EntidadId = a.EntidadId,
                    Accion = a.Accion,
                    UsuarioId = a.UsuarioId,
                    DetalleJson = a.DetalleJson,
                    Fecha = a.Fecha
                })
                .ToListAsync();
        }
    }
}