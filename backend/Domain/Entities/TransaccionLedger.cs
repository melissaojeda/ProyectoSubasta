namespace Domain.Entities
{
    public class TransaccionLedger
    {
        public int Id { get; set; }
        public int BilleteraId { get; set; }
        public Billetera Billetera { get; set; } = null!;

        public string Tipo { get; set; } = string.Empty;
        public decimal Monto { get; set; }
        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        public int? SubastaId { get; set; }
        public Subasta? Subasta { get; set; }
    }
}