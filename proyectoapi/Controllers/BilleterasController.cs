using Application.IRepository.ICommand;
using Application.IRepository.IQuery;
using Microsoft.AspNetCore.Mvc;

namespace proyectoapi.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class BilleterasController : ControllerBase
    {
        private readonly IBilleteraCommand _billeteraCommand;
        private readonly IBilleteraQuery _billeteraQuery;

        public BilleterasController(IBilleteraCommand billeteraCommand, IBilleteraQuery billeteraQuery)
        {
            _billeteraCommand = billeteraCommand;
            _billeteraQuery = billeteraQuery;
        }

        // GET: api/v1/billeteras/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var billetera = await _billeteraQuery.GetByIdAsync(id);
            if (billetera == null)
            {
                return NotFound(new { mensaje = "Billetera no encontrada." });
            }
            return Ok(billetera);
        }

        // GET: api/v1/billeteras/usuarios/5
        [HttpGet("usuarios/{usuarioId}")]
        public async Task<IActionResult> GetByUsuarioId(int usuarioId)
        {
            var billetera = await _billeteraQuery.GetByUsuarioIdAsync(usuarioId);
            if (billetera == null)
            {
                return NotFound(new { mensaje = "Billetera no encontrada para este usuario." });
            }
            return Ok(billetera);
        }

        // POST: api/v1/billeteras/{id}/transacciones
        [HttpPost("{id}/transacciones")]
        public async Task<IActionResult> Depositar(int id, [FromBody] SolicitudDepositoDTO dto)
        {
            if (dto.Monto <= 0)
            {
                return BadRequest(new { mensaje = "El monto a depositar debe ser mayor a cero." });
            }

            await _billeteraCommand.DepositarAsync(id, dto.Monto);
            return Ok(new { mensaje = $"Se acreditaron ${dto.Monto} correctamente a la billetera {id}." });
        }

        // DTO simple para recibir el JSON en el Body
        public class SolicitudDepositoDTO
        {
            public decimal Monto { get; set; }
        }
    }
}