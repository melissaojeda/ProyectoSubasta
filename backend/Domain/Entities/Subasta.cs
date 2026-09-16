namespace Domain.Entities
{
    public class Subasta
    {
        public int Id { get; set; }
        public int VendedorId { get; set; }
        public Usuario Vendedor { get; set; } = null!;

        public int CategoriaId { get; set; }
        public Categoria Categoria { get; set; } = null!;

        public string Titulo { get; set; } = string.Empty;
        public string Descripcion { get; set; } = string.Empty;
        public string UrlImagen { get; set; } = string.Empty;

        public decimal PrecioBase { get; set; }
        public decimal IncrementoMinimo { get; set; }

        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }

        public string Estado { get; set; } = "PROGRAMADA";
        public int Version { get; set; } 

        public ICollection<Puja> Pujas { get; set; } = new List<Puja>();
        public ICollection<TransaccionLedger> Transacciones { get; set; } = new List<TransaccionLedger>();
    }
}