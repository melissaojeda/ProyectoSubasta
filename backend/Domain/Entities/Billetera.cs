namespace Domain.Entities
{
    public class Billetera
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public Usuario Usuario { get; set; } = null!;
        public decimal SaldoTotal { get; set; }
        public decimal SaldoRetenido { get; set; }
        public decimal SaldoDisponible { get; set; }

        public int Version { get; set; } 

        public ICollection<TransaccionLedger> Transacciones { get; set; } = new List<TransaccionLedger>();
    }
}