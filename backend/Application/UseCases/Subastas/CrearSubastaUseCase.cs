using Application.DTOs.Subasta;
using Application.IRepository.ICommand;

namespace Application.UseCases.Subastas;

public interface ICrearSubastaUseCase
{
    Task EjecutarAsync(CreateSubastaDTO dto);
}

public class CrearSubastaUseCase : ICrearSubastaUseCase
{
    private readonly ISubastaCommand _subastaCommand;

    public CrearSubastaUseCase(ISubastaCommand subastaCommand)
    {
        _subastaCommand = subastaCommand;
    }

    public async Task EjecutarAsync(CreateSubastaDTO dto)
    {
        await _subastaCommand.CreateAsync(dto);
    }
}