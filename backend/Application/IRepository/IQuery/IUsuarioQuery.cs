using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Usuario;

namespace Application.IRepository.IQuery
{
    public interface IUsuarioQuery
    {
        Task<GetUsuarioDTO?> GetByIdAsync(int id);
        Task<IEnumerable<GetUsuarioDTO>> GetAllAsync();
        Task<GetUsuarioDTO?> LoginAsync(string email, string password);
    }
}