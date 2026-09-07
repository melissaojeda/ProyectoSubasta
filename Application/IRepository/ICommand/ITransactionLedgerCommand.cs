using Domain;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.IRepository.ICommand
{
    public interface ITransaccionLedgerCommand
    {
        Task CreateAsync(TransaccionLedger transaccion);
        Task SaveChangesAsync();
    }
}