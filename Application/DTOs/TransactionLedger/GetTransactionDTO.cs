using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.TransaccionLedger
{
    public class GetTransaccionDTO
    {
        public int Id { get; set; }
        public int BilleteraId { get; set; }
        public string Tipo { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public DateTime Fecha { get; set; }
        public int? SubastaId { get; set; }
    }
}