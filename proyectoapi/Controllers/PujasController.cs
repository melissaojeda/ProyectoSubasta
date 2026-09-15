using Application.DTOs.Puja;
using Application.IRepository.ICommand;
using Application.IRepository.IQuery;
using Microsoft.AspNetCore.Mvc;

namespace proyectoapi.Controllers
{
    [ApiController]
    [Route("api/v1/subastas/{subastaId}/[controller]")]
    public class PujasController : ControllerBase
    {
        private readonly IPujaCommand _pujaCommand;
        private readonly IPujaQuery _pujaQuery;

        public PujasController(IPujaCommand pujaCommand, IPujaQuery pujaQuery)
        {
            _pujaCommand = pujaCommand;
            _pujaQuery = pujaQuery;
        }

        // POST: api/v1/subastas/{subastaId}/pujas
        [HttpPost]
        public async Task<IActionResult> Create(int subastaId, [FromBody] CreatePujaDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // El Middleware se encarga de atrapar excepciones y devolver 400, 409, 422 o 500
            await _pujaCommand.CreateAsync(subastaId, dto);
            return StatusCode(201, new { mensaje = "Puja realizada con éxito." });
        }

        // GET: api/v1/subastas/{subastaId}/pujas/{id}
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

        // GET: api/v1/subastas/{subastaId}/pujas
        [HttpGet("subastas/{subastaId}")]
        public async Task<IActionResult> GetBySubastaId(int subastaId)
        {
            var pujas = await _pujaQuery.GetBySubastaIdAsync(subastaId);
            return Ok(pujas);
        }

        // GET: api/v1/subastas/{subastaId}/pujas/usuarios/{usuarioId}
        [HttpGet("usuarios/{usuarioId}")]
        public async Task<IActionResult> GetByUsuarioId(int usuarioId)
        {
            var pujas = await _pujaQuery.GetByUsuarioIdAsync(usuarioId);
            return Ok(pujas);
        }
    }
}