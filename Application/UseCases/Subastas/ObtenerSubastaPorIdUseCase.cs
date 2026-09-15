using Application.DTOs.Subasta;
using Application.IRepository.IQuery;

namespace Application.UseCases.Subastas;

public interface IObtenerSubastaPorIdUseCase
{
    Task<GetSubastaDTO?> EjecutarAsync(int id);
}

public class ObtenerSubastaPorIdUseCase : IObtenerSubastaPorIdUseCase
{
    private readonly ISubastaQuery _subastaQuery;

    public ObtenerSubastaPorIdUseCase(ISubastaQuery subastaQuery)
    {
        _subastaQuery = subastaQuery;
    }

    public async Task<GetSubastaDTO?> EjecutarAsync(int id)
    {
        return await _subastaQuery.GetByIdAsync(id);
    }
}