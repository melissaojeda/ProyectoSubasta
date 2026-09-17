using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Subasta
{
    public class GetSubastaDTO
    {
        public int Id { get; set; }
        public int VendedorId { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string UrlImagen { get; set; } = string.Empty;
        public decimal PrecioBase { get; set; }
        public decimal IncrementoMinimo { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public string Estado { get; set; } = string.Empty;
        public string NombreVendedor { get; set; } = string.Empty;
        public string NombreCategoria { get; set; } = string.Empty;
        public decimal MejorPuja { get; set; }
        public int CantidadPujas { get; set; }
    }
}