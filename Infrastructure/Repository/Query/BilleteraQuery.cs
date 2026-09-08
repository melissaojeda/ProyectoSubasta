using Application.DTOs.Billetera;
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
    public class BilleteraQuery : IBilleteraQuery
    {
        private readonly AppDbContext _context;

        public BilleteraQuery(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GetBilleteraDTO?> GetByIdAsync(int id)
        {
            return await _context.Billeteras
                .AsNoTracking()
                .Where(b => b.Id == id)
                .Select(b => new GetBilleteraDTO
                {
                    Id = b.Id,
                    SaldoDisponible = b.SaldoDisponible,
                    SaldoRetenido = b.SaldoRetenido,
                    UsuarioId = b.UsuarioId,
                    //probar
                    SaldoTotal = b.SaldoDisponible + b.SaldoRetenido
                })
                .FirstOrDefaultAsync();
        }

        public async Task<GetBilleteraDTO?> GetByUsuarioIdAsync(int usuarioId)
        {
            return await _context.Billeteras
                .AsNoTracking()
                .Where(b => b.UsuarioId == usuarioId)
                .Select(b => new GetBilleteraDTO
                {
                    Id = b.Id,
                    SaldoDisponible = b.SaldoDisponible,
                    SaldoRetenido = b.SaldoRetenido,
                    UsuarioId = b.UsuarioId,
                    SaldoTotal = b.SaldoDisponible + b.SaldoRetenido
                })
                .FirstOrDefaultAsync();
        }
    }
}