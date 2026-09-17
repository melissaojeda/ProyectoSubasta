using Application.IRepository.IQuery;
using Microsoft.AspNetCore.Mvc;

namespace proyectoapi.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly ICategoriaQuery _categoriaQuery;

        public CategoriasController(ICategoriaQuery categoriaQuery)
        {
            _categoriaQuery = categoriaQuery;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var categorias = await _categoriaQuery.GetAllAsync();
            return Ok(categorias);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var categoria = await _categoriaQuery.GetByIdAsync(id);

            if (categoria == null)
                return NotFound();

            return Ok(categoria);
        }
    }
}