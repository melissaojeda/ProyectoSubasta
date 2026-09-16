using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Puja
{
    public class GetPujaDTO
    {
        public int Id { get; set; }
        public int SubastaId { get; set; }
        public string NombreComprador { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public DateTime FechaPuja { get; set; }
    }
}