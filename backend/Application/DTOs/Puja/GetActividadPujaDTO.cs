namespace Application.DTOs.Puja
{
    public class GetActividadPujaDTO
    {
        public int SubastaId { get; set; }

        public string TituloSubasta { get; set; } = string.Empty;

        public string EstadoSubasta { get; set; } = string.Empty;

        public decimal MejorPuja { get; set; }

        public decimal MiMejorPuja { get; set; }

        public bool? EsGanador { get; set; }
    }
}