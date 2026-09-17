using Application.DTOs.Puja;
using Application.IRepository.IQuery;
using Application.UseCases.Pujas;
using Infrastructure.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace proyectoapi.Controllers
{
    [ApiController]
    [Route("api/v1/subastas/{subastaId}/[controller]")]
    public class PujasController : ControllerBase
    {
        private readonly ICrearPujaUseCase _crearPujaUseCase;
        private readonly IPujaQuery _pujaQuery;
        private readonly IHubContext<SubastaHub> _hubContext;
        private readonly ISubastaQuery _subastaQuery;

        public PujasController(ICrearPujaUseCase crearPujaUseCase, IPujaQuery pujaQuery, IHubContext<SubastaHub> hubContext, ISubastaQuery subastaQuery)
        {
            _crearPujaUseCase = crearPujaUseCase;
            _pujaQuery = pujaQuery;
            _hubContext = hubContext;
            _subastaQuery = subastaQuery;
        }

        // POST: api/v1/subastas/{subastaId}/pujas
        [HttpPost]
        public async Task<IActionResult> Create(int subastaId, [FromBody] CreatePujaDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Ejecuta el Caso de Uso (Persistencia y Reglas de Negocio)
            await _crearPujaUseCase.EjecutarAsync(subastaId, dto);

            var subastaActualizada = await _subastaQuery.GetByIdAsync(subastaId);

            // Emite la notificación en tiempo real vía SignalR
            await _hubContext.Clients
            .Group(subastaId.ToString())
            .SendAsync("NuevaPujaRecibida", new
            {
                SubastaId = subastaId,
                CompradorId = dto.CompradorId,
                Monto = dto.Monto,
                FechaFin = subastaActualizada?.FechaFin
            });

            return StatusCode(201, new { mensaje = "Puja realizada con éxito." });
        }

        // GET: api/v1/subastas/{subastaId}/pujas/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int subastaId, int id)
        {
            var puja = await _pujaQuery.GetByIdAndSubastaIdAsync(subastaId, id);
            if (puja == null)
            {
                return NotFound(new { mensaje = "Puja no encontrada." });
            }
            return Ok(puja);
        }

        // GET: api/v1/subastas/{subastaId}/pujas
        [HttpGet]
        public async Task<IActionResult> GetBySubastaId(int subastaId)
        {
            var pujas = await _pujaQuery.GetBySubastaIdAsync(subastaId);
            return Ok(pujas);
        }

        // GET: api/v1/subastas/{subastaId}/pujas/usuarios/{usuarioId}
        [HttpGet("usuarios/{usuarioId}")]
        public async Task<IActionResult> GetByUsuarioId(int subastaId, int usuarioId)
        {
            var pujas = await _pujaQuery.GetByUsuarioAndSubastaIdAsync(subastaId, usuarioId);
            return Ok(pujas);
        }

        // GET: api/v1/usuarios/{usuarioId}/pujas
        [HttpGet("~/api/v1/usuarios/{usuarioId}/pujas")]
        public async Task<IActionResult> GetByUsuarioId(int usuarioId)
        {
            var pujas = await _pujaQuery.GetByUsuarioIdAsync(usuarioId);
            return Ok(pujas);
        }

        // GET: api/v1/usuarios/{usuarioId}/actividades/pujas
        [HttpGet("~/api/v1/usuarios/{usuarioId}/actividades/pujas")]
        public async Task<IActionResult> GetActividadesByUsuarioId(int usuarioId)
        {
            var actividades = await _pujaQuery.GetActividadesByUsuarioIdAsync(usuarioId);
            return Ok(actividades);
        }
    }
}