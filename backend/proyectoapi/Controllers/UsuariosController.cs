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
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return BadRequest(new { mensaje = "El nombre es obligatorio." });
            }

            if (dto.Nombre.Trim().Length > 20)
            {
                return BadRequest(new
                {
                    mensaje = "El nombre no puede superar los 20 caracteres."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.Apellido))
            {
                return BadRequest(new { mensaje = "El apellido es obligatorio." });
            }

            if (dto.Apellido.Trim().Length > 15)
            {
                return BadRequest(new
                {
                    mensaje = "El apellido no puede superar los 15 caracteres."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { mensaje = "El email es obligatorio." });
            }

            try
            {
                var email = new System.Net.Mail.MailAddress(dto.Email.Trim());

                if (email.Address != dto.Email.Trim())
                {
                    return BadRequest(new { mensaje = "El email no es válido." });
                }
            }
            catch
            {
                return BadRequest(new { mensaje = "El email no es válido." });
            }

            if (string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { mensaje = "La contraseña es obligatoria." });
            }

            if (dto.Password.Length < 8)
            {
                return BadRequest(new
                {
                    mensaje = "La contraseña debe tener al menos 8 caracteres."
                });
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

        // POST: api/v1/usuarios/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginUsuarioDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new
                {
                    mensaje = "Email y contraseña son obligatorios."
                });
            }

            var usuario = await _usuarioQuery.LoginAsync(
                dto.Email,
                dto.Password);

            if (usuario == null)
            {
                return Unauthorized(new
                {
                    mensaje = "Email o contraseña incorrectos."
                });
            }

            return Ok(usuario);
        }
    }
}