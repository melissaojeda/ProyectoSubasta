using Application.DTOs.Usuario;
using Application.IRepository.ICommand;
using Application.IRepository.IQuery;
using Microsoft.AspNetCore.Mvc;

namespace proyectoapi.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly IUsuarioQuery _usuarioQuery;
        private readonly IUsuarioCommand _usuarioCommand;

        public UsuariosController(
            IUsuarioQuery usuarioQuery,
            IUsuarioCommand usuarioCommand)
        {
            _usuarioQuery = usuarioQuery;
            _usuarioCommand = usuarioCommand;
        }

        // GET: api/v1/usuarios
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var usuarios = await _usuarioQuery.GetAllAsync();

            return Ok(usuarios);
        }

        // GET: api/v1/usuarios/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var usuario = await _usuarioQuery.GetByIdAsync(id);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
            }

            return Ok(usuario);
        }

        // POST: api/v1/usuarios
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUsuarioDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            await _usuarioCommand.CreateAsync(dto);

            return StatusCode(201, new
            {
                mensaje = "Usuario creado exitosamente."
            });
        }

        // PUT: api/v1/usuarios/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateUsuarioDTO dto)
        {
            var usuario = await _usuarioQuery.GetByIdAsync(id);

            if (usuario == null)
            {
                return NotFound(new
                {
                    mensaje = "Usuario no encontrado."
                });
            }

            dto.Id = id;

            await _usuarioCommand.UpdateAsync(dto);

            return Ok(new
            {
                mensaje = "Usuario actualizado exitosamente."
            });
        }
    }
}