using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.AuditoriaLog;

namespace Application.IRepository.IQuery
{
    public interface IAuditoriaLogQuery
    {
        Task<GetAuditoriaLogDTO?> GetByIdAsync(int id);
        Task<IEnumerable<GetAuditoriaLogDTO>> GetAllAsync();
        Task<IEnumerable<GetAuditoriaLogDTO>> GetByEntidadAsync(string entidad);
        Task<IEnumerable<GetAuditoriaLogDTO>> GetByUsuarioIdAsync(int usuarioId);
    }
}