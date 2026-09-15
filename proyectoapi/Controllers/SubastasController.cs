using Application.DTOs.Subasta;
using Microsoft.AspNetCore.Mvc;
using Application.UseCases.Subastas;

namespace proyectoapi.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class SubastasController : ControllerBase
    {
        private readonly ICrearSubastaUseCase _crearSubastaUseCase;
        private readonly IObtenerSubastasUseCase _obtenerSubastasUseCase;
        private readonly IObtenerSubastaPorIdUseCase _obtenerSubastaPorIdUseCase;
        public SubastasController(ICrearSubastaUseCase crearSubastaUseCase, IObtenerSubastasUseCase obtenerSubastasUseCase, IObtenerSubastaPorIdUseCase obtenerSubastaPorIdUseCase)
        {
            _crearSubastaUseCase = crearSubastaUseCase;
            _obtenerSubastasUseCase = obtenerSubastasUseCase;
            _obtenerSubastaPorIdUseCase = obtenerSubastaPorIdUseCase;
        }

        // GET: api/v1/subastas
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var subastas = await _obtenerSubastasUseCase.EjecutarAsync();
            return Ok(subastas);
        }

        // GET: api/v1/subastas/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var subasta = await _obtenerSubastaPorIdUseCase.EjecutarAsync(id);
            if (subasta == null)
            {
                return NotFound(new { mensaje = "Subasta no encontrada." });
            }
            return Ok(subasta);
        }

        // POST: api/v1/subastas
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSubastaDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            await _crearSubastaUseCase.EjecutarAsync(dto);
            return StatusCode(201, new { mensaje = "Subasta creada exitosamente." });
        }
    }
}