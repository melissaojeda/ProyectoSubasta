namespace Domain.Entities
{
    public class Puja
    {
        public int Id { get; set; }
        public int SubastaId { get; set; }
        public Subasta Subasta { get; set; } = null!;

        public int CompradorId { get; set; }
        public Usuario Comprador { get; set; } = null!;

        public decimal Monto { get; set; }
        public DateTime FechaPuja { get; set; } = DateTime.UtcNow;
    }
}