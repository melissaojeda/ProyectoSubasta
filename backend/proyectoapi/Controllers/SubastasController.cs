using Application.DTOs.Subasta;
using Microsoft.AspNetCore.Mvc;
using Application.UseCases.Subastas;
using Application.IRepository.IQuery;

namespace proyectoapi.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class SubastasController : ControllerBase
    {
        private readonly ICrearSubastaUseCase _crearSubastaUseCase;
        private readonly IObtenerSubastasUseCase _obtenerSubastasUseCase;
        private readonly IObtenerSubastaPorIdUseCase _obtenerSubastaPorIdUseCase;
        private readonly ISubastaQuery _subastaQuery;

        public SubastasController(ICrearSubastaUseCase crearSubastaUseCase, IObtenerSubastasUseCase obtenerSubastasUseCase, IObtenerSubastaPorIdUseCase obtenerSubastaPorIdUseCase, ISubastaQuery subastaQuery)
        {
            _crearSubastaUseCase = crearSubastaUseCase;
            _obtenerSubastasUseCase = obtenerSubastasUseCase;
            _obtenerSubastaPorIdUseCase = obtenerSubastaPorIdUseCase;
            _subastaQuery = subastaQuery;
        }

        // GET: api/v1/subastas
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] string? estado,
            [FromQuery] int? categoriaId,
            [FromQuery] decimal? precioMin,
            [FromQuery] decimal? precioMax,
            [FromQuery] string? orden,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanioPagina = 10)
        {
            var subastas = await _obtenerSubastasUseCase.EjecutarAsync(
                estado,
                categoriaId,
                precioMin,
                precioMax,
                orden,
                pagina,
                tamanioPagina);

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

        // GET: api/v1/usuarios/{usuarioId}/subastas
        [HttpGet("~/api/v1/usuarios/{usuarioId}/subastas")]
        public async Task<IActionResult> GetByVendedorId(int usuarioId)
        {
            var subastas = await _subastaQuery.GetByVendedorIdAsync(usuarioId);

            return Ok(subastas);
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