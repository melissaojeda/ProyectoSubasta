using Application.DTOs.Subasta;
using Application.IRepository.IQuery;

namespace Application.UseCases.Subastas;

public interface IObtenerSubastasUseCase
{
    Task<IEnumerable<GetSubastaDTO>> EjecutarAsync(
        string? estado,
        int? categoriaId,
        decimal? precioMin,
        decimal? precioMax,
        string? orden),
        int pagina,
        int tamanioPagina);
}

public class ObtenerSubastasUseCase : IObtenerSubastasUseCase
{
    private readonly ISubastaQuery _subastaQuery;

    public ObtenerSubastasUseCase(ISubastaQuery subastaQuery)
    {
        _subastaQuery = subastaQuery;
    }

    public async Task<IEnumerable<GetSubastaDTO>> EjecutarAsync(
    string? estado,
    int? categoriaId,
    decimal? precioMin,
    decimal? precioMax,
    string? orden,
    int pagina,
    int tamanioPagina)
    {
        if (pagina < 1)
        {
            throw new ArgumentException("La página debe ser mayor o igual a 1.");
        }

        if (tamanioPagina < 1)
        {
            throw new ArgumentException("El tamaño de página debe ser mayor o igual a 1.");
        }

        return await _subastaQuery.GetAllAsync(
            estado,
            categoriaId,
            precioMin,
            precioMax,
            orden,
            pagina,
            tamanioPagina);
    }
}