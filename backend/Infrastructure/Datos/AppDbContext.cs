using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Datos
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Billetera> Billeteras { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<Subasta> Subastas { get; set; }
        public DbSet<Puja> Pujas { get; set; }
        public DbSet<TransaccionLedger> TransaccionesLedger { get; set; }
        public DbSet<AuditoriaLog> AuditoriasLog { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Concurrencia Optimista
            modelBuilder.Entity<Billetera>()
                .Property(b => b.Version)
                .IsConcurrencyToken();

            modelBuilder.Entity<Subasta>()
                .Property(s => s.Version)
                .IsConcurrencyToken();

            // Relación Subasta - Vendedor (Usuario)
            modelBuilder.Entity<Subasta>()
                .HasOne(s => s.Vendedor)
                .WithMany(u => u.SubastasPublicadas)
                .HasForeignKey(s => s.VendedorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Relación Puja - Comprador (Usuario)
            modelBuilder.Entity<Puja>()
                .HasOne(p => p.Comprador)
                .WithMany(u => u.PujasRealizadas)
                .HasForeignKey(p => p.CompradorId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indicamos que la entidad Subasta usará el campo RowVersion 
            // como token de concurrencia optimista
            modelBuilder.Entity<Subasta>()
                .Property(subasta => subasta.Version)
                .IsConcurrencyToken();
        }
    }
}