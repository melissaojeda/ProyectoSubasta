using Application.DTOs.Puja;
using Application.IRepository.ICommand;

namespace Application.UseCases.Pujas;

public interface ICrearPujaUseCase
{
    Task EjecutarAsync(int subastaId, CreatePujaDTO dto);
}

public class CrearPujaUseCase : ICrearPujaUseCase
{
    private readonly IPujaCommand _pujaCommand;

    public CrearPujaUseCase(IPujaCommand pujaCommand)
    {
        _pujaCommand = pujaCommand;
    }

    public async Task EjecutarAsync(int subastaId, CreatePujaDTO dto)
    {
        await _pujaCommand.CreateAsync(subastaId, dto);
    }
}