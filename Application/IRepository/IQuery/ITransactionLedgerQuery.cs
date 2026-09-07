using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

using Application.DTOs.TransaccionLedger;

namespace Application.IRepository.IQuery
{
    public interface ITransaccionLedgerQuery
    {
        Task<GetTransaccionDTO?> GetByIdAsync(int id);
        Task<IEnumerable<GetTransaccionDTO>> GetByBilleteraIdAsync(int billeteraId);
    }
}