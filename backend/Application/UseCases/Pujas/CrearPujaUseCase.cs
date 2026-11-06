using Application.DTOs.Puja;
using Application.IRepository.ICommand;
using Application.IRepository.IQuery;
using Domain.Entities;

namespace Application.UseCases.Pujas;

public interface ICrearPujaUseCase
{
    Task EjecutarAsync(int subastaId, CreatePujaDTO dto);
}

public class CrearPujaUseCase : ICrearPujaUseCase
{
    private readonly IPujaCommand _pujaCommand;
    private readonly ISubastaQuery _subastaQuery;
    private readonly IBilleteraQuery _billeteraQuery;
    private readonly IAuditoriaLogCommand _auditoriaLogCommand;

    public CrearPujaUseCase(IPujaCommand pujaCommand,
        ISubastaQuery subastaQuery,
        IBilleteraQuery billeteraQuery,
        IAuditoriaLogCommand auditoriaLogCommand)
    {
        _pujaCommand = pujaCommand;
        _subastaQuery = subastaQuery;
        _billeteraQuery = billeteraQuery;
        _auditoriaLogCommand = auditoriaLogCommand;
    }

    public async Task EjecutarAsync(int subastaId, CreatePujaDTO dto)
    {
        var subasta = await _subastaQuery.GetByIdAsync(subastaId);
        if (subasta == null)
            throw new KeyNotFoundException("La subasta no existe.");

        if (subasta.VendedorId == dto.CompradorId)
        {
            await AuditarRechazoAsync(subastaId, dto,
                "RECHAZADA_VENDEDOR",
                $"{{\"MontoIntentado\": {dto.Monto}, \"mensaje\": \"El vendedor intentó pujar en su propia subasta.\"}}");
            throw new InvalidOperationException(
                "El dueño de la subasta no puede pujar por ella.");
        }

        if (dto.Monto > 99_999_999.99m)
            throw new ArgumentException("La puja no puede superar $99.999.999,99.");

        if (DateTime.UtcNow > subasta.FechaFin)
        {
            await AuditarRechazoAsync(subastaId, dto,
                "RECHAZADA_SUBASTA_FINALIZADA",
                $"{{\"MontoIntentado\": {dto.Monto}, \"mensaje\": \"La subasta ya ha finalizado.\"}}");
            throw new InvalidOperationException("La subasta ya ha finalizado.");
        }

        if (subasta.Estado != "ACTIVA")
        {
            await AuditarRechazoAsync(subastaId, dto,
                "RECHAZADA_SUBASTA_NO_ACTIVA",
                $"{{\"MontoIntentado\": {dto.Monto}, \"EstadoSubasta\": \"{subasta.Estado}\"}}");
            throw new InvalidOperationException("La subasta no se encuentra activa.");
        }

        var precioMinimoRequerido = subasta.MejorPostorId.HasValue
            ? subasta.MejorPuja + subasta.IncrementoMinimo
            : subasta.PrecioBase;

        if (dto.Monto < precioMinimoRequerido)
        {
            await AuditarRechazoAsync(subastaId, dto,
                "RECHAZADA_MONTO_INSUFICIENTE",
                $"{{\"MontoIntentado\": {dto.Monto}, \"MontoMinimoRequerido\": {precioMinimoRequerido}}}");
            throw new ArgumentException(
                $"El monto debe ser superior o igual al valor mínimo requerido (${precioMinimoRequerido}).");
        }

        var billetera = await _billeteraQuery.GetByUsuarioIdAsync(dto.CompradorId);
        if (billetera == null)
            throw new ArgumentException("El comprador no posee una billetera activa.");

        var montoNecesario = subasta.MejorPostorId == dto.CompradorId
            ? dto.Monto - subasta.MejorPuja
            : dto.Monto;

        if (billetera.SaldoDisponible < montoNecesario)
        {
            await AuditarRechazoAsync(subastaId, dto,
                "RECHAZADA_FONDOS_INSUFICIENTES",
                $"{{\"MontoIntentado\": {dto.Monto}, \"SaldoDisponible\": {billetera.SaldoDisponible}}}");
            throw new InvalidOperationException(
                "Saldo insuficiente en la billetera para realizar la oferta.");
        }

        // La decisión de prorrogar pertenece al caso de uso; Infrastructure la persiste.
        var restante = subasta.FechaFin - DateTime.UtcNow;
        DateTime? nuevaFechaFin = restante.TotalSeconds <= 60 && restante.TotalSeconds > 0
            ? subasta.FechaFin.AddMinutes(2)
            : null;

        await _pujaCommand.CreateAsync(subastaId, dto,
            subasta.Version, billetera.Version, nuevaFechaFin);
    }

    private async Task AuditarRechazoAsync(int subastaId, CreatePujaDTO dto,
        string accion, string detalleJson)
    {
        await _auditoriaLogCommand.CreateAsync(new AuditoriaLog
        {
            Entidad = "Puja",
            EntidadId = subastaId,
            Accion = accion,
            UsuarioId = dto.CompradorId,
            DetalleJson = detalleJson,
            Fecha = DateTime.UtcNow
        });
    }
}