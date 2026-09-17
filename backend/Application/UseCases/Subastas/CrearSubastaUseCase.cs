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
        if (string.IsNullOrWhiteSpace(dto.Titulo))
        {
            throw new ArgumentException("El título es obligatorio.");
        }

        if (dto.Titulo.Trim().Length > 35)
        {
            throw new ArgumentException(
                "El título no puede superar los 35 caracteres.");
        }

        if (string.IsNullOrWhiteSpace(dto.Descripcion))
        {
            throw new ArgumentException("La descripción es obligatoria.");
        }

        if (dto.Descripcion.Trim().Length > 200)
        {
            throw new ArgumentException(
                "La descripción no puede superar los 200 caracteres.");
        }

        if (string.IsNullOrWhiteSpace(dto.UrlImagen))
        {
            throw new ArgumentException(
                "La URL de imagen es obligatoria.");
        }

        if (!Uri.TryCreate(
                dto.UrlImagen.Trim(),
                UriKind.Absolute,
                out var urlImagen)
            || (urlImagen.Scheme != Uri.UriSchemeHttp
                && urlImagen.Scheme != Uri.UriSchemeHttps))
        {
            throw new ArgumentException(
                "La URL de imagen debe ser una dirección HTTP o HTTPS válida.");
        }

        if (dto.PrecioBase < 1000)
        {
            throw new ArgumentException(
                "El precio base debe ser de al menos $1000.");
        }

        if (dto.PrecioBase > 9_999_999.99m)
        {
            throw new ArgumentException(
                "El precio base no puede superar $9.999.999,99.");
        }

        if (dto.IncrementoMinimo < 1000)
        {
            throw new ArgumentException(
                "El incremento mínimo debe ser de al menos $1000.");
        }

        if (dto.IncrementoMinimo > 9_999_999.99m)
        {
            throw new ArgumentException(
                "El incremento mínimo no puede superar $9.999.999,99.");
        }

        if (dto.FechaInicio <= DateTime.UtcNow)
        {
            throw new ArgumentException(
                "La fecha de inicio debe ser posterior al momento actual.");
        }

        if (dto.FechaFin <= dto.FechaInicio)
        {
            throw new ArgumentException(
                "La fecha de fin debe ser posterior a la fecha de inicio.");
        }

        dto.Titulo = dto.Titulo.Trim();
        dto.Descripcion = dto.Descripcion.Trim();
        dto.UrlImagen = dto.UrlImagen.Trim();

        await _subastaCommand.CreateAsync(dto);
    }
}