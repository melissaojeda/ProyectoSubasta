using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Puja
{
    public class CreatePujaDTO
    {
        public int CompradorId { get; set; }
        public decimal Monto { get; set; }
    }
}