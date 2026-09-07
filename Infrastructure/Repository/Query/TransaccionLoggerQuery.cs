using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.TransaccionLedger;
using Application.IRepository.IQuery;
using Infrastructure.Datos;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository.Query
{
    public class TransaccionLedgerQuery : ITransaccionLedgerQuery
    {
        private readonly AppDbContext _context;

        public TransaccionLedgerQuery(AppDbContext context)
        {
            _context = context;
        }

        public async Task<GetTransaccionDTO?> GetByIdAsync(int id)
        {
            return await _context.TransaccionesLedger
                .AsNoTracking()
                .Where(t => t.Id == id)
                .Select(t => new GetTransaccionDTO
                {
                    Id = t.Id,
                    BilleteraId = t.BilleteraId,
                    Tipo = t.Tipo,
                    Monto = t.Monto,
                    Fecha = t.Fecha,
                    SubastaId = t.SubastaId
                })
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<GetTransaccionDTO>> GetByBilleteraIdAsync(int billeteraId)
        {
            return await _context.TransaccionesLedger
                .AsNoTracking()
                .Where(t => t.BilleteraId == billeteraId)
                .Select(t => new GetTransaccionDTO
                {
                    Id = t.Id,
                    BilleteraId = t.BilleteraId,
                    Tipo = t.Tipo,
                    Monto = t.Monto,
                    Fecha = t.Fecha,
                    SubastaId = t.SubastaId
                })
                .ToListAsync();
        }
    }
}