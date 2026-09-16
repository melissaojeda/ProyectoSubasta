using Application.IRepository.ICommand;

namespace Application.UseCases.Billeteras;

public interface IDepositarBilleteraUseCase
{
    Task EjecutarAsync(int billeteraId, decimal monto);
}

public class DepositarBilleteraUseCase : IDepositarBilleteraUseCase
{
    private readonly IBilleteraCommand _billeteraCommand;

    public DepositarBilleteraUseCase(IBilleteraCommand billeteraCommand)
    {
        _billeteraCommand = billeteraCommand;
    }

    public async Task EjecutarAsync(int billeteraId, decimal monto)
    {
        if (monto <= 0)
        {
            throw new ArgumentException("El monto a depositar debe ser mayor a cero.");
        }

        await _billeteraCommand.DepositarAsync(billeteraId, monto);
    }
}