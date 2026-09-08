using Application.IRepository.ICommand;
using Application.IRepository.IQuery;
using Microsoft.AspNetCore.Mvc;

namespace proyectoapi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BilleterasController : ControllerBase
    {
        private readonly IBilleteraCommand _billeteraCommand;
        private readonly IBilleteraQuery _billeteraQuery;

        public BilleterasController(IBilleteraCommand billeteraCommand, IBilleteraQuery billeteraQuery)
        {
            _billeteraCommand = billeteraCommand;
            _billeteraQuery = billeteraQuery;
        }

        // GET: api/billeteras/5
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

        // GET: api/billeteras/usuario/5 (Desglose de saldos)
        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> GetByUsuarioId(int usuarioId)
        {
            var billetera = await _billeteraQuery.GetByUsuarioIdAsync(usuarioId);
            if (billetera == null)
            {
                return NotFound(new { mensaje = "Billetera no encontrada para este usuario." });
            }
            return Ok(billetera);
        }

        // POST: api/billeteras/depositar (Carga de fondos simulados)
        [HttpPost("depositar")]
        public async Task<IActionResult> Depositar(int usuarioId, decimal monto)
        {
            if (monto <= 0)
            {
                return BadRequest(new { mensaje = "El monto a depositar debe ser mayor a cero." });
            }

            try
            {
                await _billeteraCommand.DepositarAsync(usuarioId, monto);
                return Ok(new { mensaje = $"Se acreditaron ${monto} correctamente al usuario {usuarioId}." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }
    }
}