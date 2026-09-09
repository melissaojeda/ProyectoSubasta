using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace proyectoapi.Middlewares
{
    public class ManejoExcepcionesMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ManejoExcepcionesMiddleware> _logger;

        public ManejoExcepcionesMiddleware(RequestDelegate next, ILogger<ManejoExcepcionesMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext httpContext)
        {
            try
            {
                await _next(httpContext);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Excepción capturada: {ex.Message}");
                await ManejarExcepcionAsync(httpContext, ex);
            }
        }

        private static Task ManejarExcepcionAsync(HttpContext context, Exception excepcion)
        {
            context.Response.ContentType = "application/json";

            var code = HttpStatusCode.InternalServerError;
            var mensaje = "Ocurrió un error interno en el servidor.";

            switch (excepcion)
            {
                case DbUpdateConcurrencyException:
                    code = HttpStatusCode.Conflict; // HTTP 409
                    mensaje = "Conflicto de concurrencia: El recurso fue modificado por otro usuario. Intente nuevamente.";
                    break;

                case InvalidOperationException ex when ex.Message.Contains("Saldo insuficiente"):
                    code = HttpStatusCode.UnprocessableEntity; // HTTP 422
                    mensaje = ex.Message;
                    break;

                case ArgumentException ex:
                    code = HttpStatusCode.BadRequest; // HTTP 400
                    mensaje = ex.Message;
                    break;

                case Exception ex when !string.IsNullOrEmpty(ex.Message):
                    code = HttpStatusCode.BadRequest; // HTTP 400
                    mensaje = ex.Message;
                    break;
            }

            context.Response.StatusCode = (int)code;

            var resultado = JsonSerializer.Serialize(new
            {
                status = context.Response.StatusCode,
                error = mensaje,
                timestamp = DateTime.UtcNow
            });

            return context.Response.WriteAsync(resultado);
        }
    }
}