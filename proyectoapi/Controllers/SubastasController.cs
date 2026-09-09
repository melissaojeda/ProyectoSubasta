using Application.DTOs.Subasta;
using Application.IRepository.ICommand;
using Application.IRepository.IQuery;
using Microsoft.AspNetCore.Mvc;

namespace proyectoapi.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class SubastasController : ControllerBase
    {
        private readonly ISubastaCommand _subastaCommand;
        private readonly ISubastaQuery _subastaQuery;

        public SubastasController(ISubastaCommand subastaCommand, ISubastaQuery subastaQuery)
        {
            _subastaCommand = subastaCommand;
            _subastaQuery = subastaQuery;
        }

        // GET: api/v1/subastas
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var subastas = await _subastaQuery.GetAllAsync();
            return Ok(subastas);
        }

        // GET: api/v1/subastas/5
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

        // POST: api/v1/subastas
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSubastaDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            await _subastaCommand.CreateAsync(dto);
            return Ok(new { mensaje = "Subasta creada exitosamente." });
        }
    }
}