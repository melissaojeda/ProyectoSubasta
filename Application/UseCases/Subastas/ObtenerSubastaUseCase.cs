using Application.DTOs.Subasta;
using Application.IRepository.IQuery;

namespace Application.UseCases.Subastas;

public interface IObtenerSubastasUseCase
{
    Task<IEnumerable<GetSubastaDTO>> EjecutarAsync();
}

public class ObtenerSubastasUseCase : IObtenerSubastasUseCase
{
    private readonly ISubastaQuery _subastaQuery;

    public ObtenerSubastasUseCase(ISubastaQuery subastaQuery)
    {
        _subastaQuery = subastaQuery;
    }

    public async Task<IEnumerable<GetSubastaDTO>> EjecutarAsync()
    {
        return await _subastaQuery.GetAllAsync();
    }
}