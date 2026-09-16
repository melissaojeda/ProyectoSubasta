using Application.DTOs.Billetera;
using Domain;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.IRepository.ICommand
{
    public interface IBilleteraCommand
    {
        Task CreateAsync(Billetera billetera);
        Task UpdateAsync(Billetera billetera);
        Task DepositarAsync(int billeteraId, decimal monto);
        Task SaveChangesAsync();
    }
}