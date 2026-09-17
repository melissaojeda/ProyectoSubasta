using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Subasta;

namespace Application.IRepository.IQuery
{
    public interface ISubastaQuery
    {
        Task<GetSubastaDTO?> GetByIdAsync(int id);
        Task<IEnumerable<GetSubastaDTO>> GetAllAsync();
        Task<IEnumerable<GetSubastaDTO>> GetByEstadoAsync(string estado);
        Task<IEnumerable<GetSubastaDTO>> GetByCategoriaAsync(int categoriaId);
        Task<IEnumerable<GetSubastaDTO>> GetByVendedorIdAsync(int vendedorId);
        Task<IEnumerable<GetSubastaDTO>> GetFiltradasAsync(
        string? estado,
        int? categoriaId,
        decimal? precioMin,
        decimal? precioMax,
        string? orden);
        int pagina,
        int tamanioPagina
    }

}