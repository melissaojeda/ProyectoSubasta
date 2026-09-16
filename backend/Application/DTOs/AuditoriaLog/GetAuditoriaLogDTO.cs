using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.AuditoriaLog
{
    public class GetAuditoriaLogDTO
    {
        public int Id { get; set; }
        public string Entidad { get; set; } = string.Empty;
        public int EntidadId { get; set; }
        public string Accion { get; set; } = string.Empty;
        public int? UsuarioId { get; set; }
        public string DetalleJson { get; set; } = string.Empty;
        public DateTime Fecha { get; set; }
    }
}