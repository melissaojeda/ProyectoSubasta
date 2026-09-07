using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Billetera;

namespace Application.IRepository.IQuery
{
    public interface IBilleteraQuery
    {
        Task<GetBilleteraDTO?> GetByIdAsync(int id);
        Task<GetBilleteraDTO?> GetByUsuarioIdAsync(int usuarioId);
    }
}