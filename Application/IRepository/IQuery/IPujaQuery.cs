using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Puja;

namespace Application.IRepository.IQuery
{
    public interface IPujaQuery
    {
        Task<GetPujaDTO?> GetByIdAsync(int id);
        Task<IEnumerable<GetPujaDTO>> GetBySubastaIdAsync(int subastaId);
        Task<IEnumerable<GetPujaDTO>> GetByUsuarioIdAsync(int usuarioId);
    }
}