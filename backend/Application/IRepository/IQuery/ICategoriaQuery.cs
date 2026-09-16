using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Categoria;

namespace Application.IRepository.IQuery
{
    public interface ICategoriaQuery
    {
        Task<GetCategoriaDTO?> GetByIdAsync(int id);
        Task<IEnumerable<GetCategoriaDTO>> GetAllAsync();
    }
}