using Application.DTOs.Subasta;
using Application.IRepository.ICommand;
using Application.IRepository.IQuery;
using Microsoft.AspNetCore.Mvc;

namespace proyectoapi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubastasController : ControllerBase
    {
        private readonly ISubastaCommand _subastaCommand;
        private readonly ISubastaQuery _subastaQuery;

        public SubastasController(ISubastaCommand subastaCommand, ISubastaQuery subastaQuery)
        {
            _subastaCommand = subastaCommand;
            _subastaQuery = subastaQuery;
        }

        // GET: api/subastas (Listado general / Paginado)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var subastas = await _subastaQuery.GetAllAsync();
            return Ok(subastas);
        }

        // GET: api/subastas/5 (Detalle completo)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var subasta = await _subastaQuery.GetByIdAsync(id);
            if (subasta == null)
            {
                return NotFound(new { mensaje = "Subasta no encontrada." });
            }
            return Ok(subasta);
        }

        // POST: api/subastas (Crear nueva subasta)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSubastaDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                await _subastaCommand.CreateAsync(dto);
                return Ok(new { mensaje = "Subasta creada exitosamente." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }
    }
}