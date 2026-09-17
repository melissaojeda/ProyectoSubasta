using Application.DTOs.Subasta;
using Application.IRepository.ICommand;
using Application.IRepository.IQuery;

namespace Application.UseCases.Subastas;

public interface ICrearSubastaUseCase
{
    Task EjecutarAsync(CreateSubastaDTO dto);
}

public class CrearSubastaUseCase : ICrearSubastaUseCase
{
    private readonly ISubastaCommand _subastaCommand;
    private readonly IUsuarioQuery _usuarioQuery;
    private readonly ICategoriaQuery _categoriaQuery;

    public CrearSubastaUseCase(ISubastaCommand subastaCommand, IUsuarioQuery usuarioQuery, ICategoriaQuery categoriaQuery)
    {
        _subastaCommand = subastaCommand;
        _usuarioQuery = usuarioQuery;
        _categoriaQuery = categoriaQuery;
    }

    public async Task EjecutarAsync(CreateSubastaDTO dto)
    {
        if (dto.PrecioBase <= 0)
        {
            throw new ArgumentException("El precio base debe ser mayor a cero.");
        }

        if (dto.IncrementoMinimo <= 0)
        {
            throw new ArgumentException("El incremento mínimo debe ser mayor a cero.");
        }

        if (dto.FechaFin <= dto.FechaInicio)
        {
            throw new ArgumentException("La fecha de fin debe ser posterior a la fecha de inicio.");
        }

        var vendedor = await _usuarioQuery.GetByIdAsync(dto.VendedorId);

        if (vendedor == null)
        {
            throw new KeyNotFoundException("El vendedor no existe.");
        }

        var categoria = await _categoriaQuery.GetByIdAsync(dto.CategoriaId);

        if (categoria == null)
        {
            throw new KeyNotFoundException("La categoría no existe.");
        }

        await _subastaCommand.CreateAsync(dto);
    }
}