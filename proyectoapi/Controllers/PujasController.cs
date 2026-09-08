using Application.DTOs.Puja;
using Application.IRepository.ICommand;
using Application.IRepository.IQuery;
using Microsoft.AspNetCore.Mvc;

namespace proyectoapi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PujasController : ControllerBase
    {
        private readonly IPujaCommand _pujaCommand;
        private readonly IPujaQuery _pujaQuery;

        public PujasController(IPujaCommand pujaCommand, IPujaQuery pujaQuery)
        {
            _pujaCommand = pujaCommand;
            _pujaQuery = pujaQuery;
        }

        // POST: api/pujas
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePujaDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _pujaCommand.CreateAsync(dto);
                return Ok(new { mensaje = "Puja realizada con éxito." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        // GET: api/pujas/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var puja = await _pujaQuery.GetByIdAsync(id);
            if (puja == null)
            {
                return NotFound(new { mensaje = "Puja no encontrada." });
            }
            return Ok(puja);
        }

        // GET: api/pujas/subasta/5
        [HttpGet("subasta/{subastaId}")]
        public async Task<IActionResult> GetBySubastaId(int subastaId)
        {
            var pujas = await _pujaQuery.GetBySubastaIdAsync(subastaId);
            return Ok(pujas);
        }

        // GET: api/pujas/usuario/5
        [HttpGet("usuario/{usuarioId}")]
        public async Task<IActionResult> GetByUsuarioId(int usuarioId)
        {
            var pujas = await _pujaQuery.GetByUsuarioIdAsync(usuarioId);
            return Ok(pujas);
        }
    }
}