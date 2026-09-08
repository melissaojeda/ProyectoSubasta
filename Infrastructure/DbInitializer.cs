using Domain.Entities;
using Infrastructure.Datos;

namespace Infrastructure.Datos
{
    public static class DbInitializer
    {
        public static void Seed(AppDbContext context)
        {   
            //SEED DE CATEGORÍAS (4 Categorías)
            
            if (!context.Categorias.Any())
            {
                var categorias = new List<Categoria>
                {
                    new Categoria { Nombre = "Tecnología" },
                    new Categoria { Nombre = "Coleccionables" },
                    new Categoria { Nombre = "Indumentaria" },
                    new Categoria { Nombre = "Vehículos" }
                };

                context.Categorias.AddRange(categorias);
                context.SaveChanges();
            }

            // SEED DE USUARIOS Y BILLETERAS (4 Usuarios)
            if (!context.Usuarios.Any())
            {
                var vendedor = new Usuario
                {
                    Nombre = "Vendedor",
                    Apellido = "Test",
                    Email = "vendedor@test.com",
                    PasswordHash = "password123"
                };

                var comprador1 = new Usuario
                {
                    Nombre = "Comprador",
                    Apellido = "Lider",
                    Email = "comprador1@test.com",
                    PasswordHash = "password123"
                };

                var comprador2 = new Usuario
                {
                    Nombre = "Comprador",
                    Apellido = "Habilitado",
                    Email = "comprador2@test.com",
                    PasswordHash = "password123"
                };

                var sinFondos = new Usuario
                {
                    Nombre = "Usuario",
                    Apellido = "SinFondos",
                    Email = "sinfondos@test.com",
                    PasswordHash = "password123"
                };

                context.Usuarios.AddRange(vendedor, comprador1, comprador2, sinFondos);
                context.SaveChanges();

                // Billeteras asociadas a los Usuarios
                var billeteras = new List<Billetera>
                {
                    // Vendedor: Saldo $0
                    new Billetera { Usuario = vendedor, SaldoDisponible = 0, SaldoRetenido = 0 },

                    // Comprador 1: Total $150.000 / Retenido $45.000 / Disponible $105.000
                    new Billetera { Usuario = comprador1, SaldoDisponible = 105000, SaldoRetenido = 45000 },

                    // Comprador 2: Total $200.000 / Retenido $0 / Disponible $200.000
                    new Billetera { Usuario = comprador2, SaldoDisponible = 200000, SaldoRetenido = 0 },

                    // SinFondos: Total $500 / Retenido $0 / Disponible $500
                    new Billetera { Usuario = sinFondos, SaldoDisponible = 500, SaldoRetenido = 0 }
                };

                context.Billeteras.AddRange(billeteras);
                context.SaveChanges();
            }

            
            // SEED DE SUBASTAS, PUJAS Y LEDGER
            if (!context.Subastas.Any())
            {
                var vendedor = context.Usuarios.First(usuario => usuario.Email == "vendedor@test.com");
                var comprador1 = context.Usuarios.First(usuario => usuario.Email == "comprador1@test.com");
                var comprador2 = context.Usuarios.First(usuario => usuario.Email == "comprador2@test.com");

                var categoriaTecno = context.Categorias.First(categoria => categoria.Nombre == "Tecnología");
                var categoriaAutos = context.Categorias.First(categoria => categoria.Nombre == "Vehículos");
                var categoriaColeccionables = context.Categorias.First(categoria => categoria.Nombre == "Coleccionables");

                var fechaActual = DateTime.UtcNow;

                // Obtenemos las billeteras creadas previamente
                var billeteraComprador1 = context.Billeteras.First(billetera => billetera.UsuarioId == comprador1.Id);
                var billeteraComprador2 = context.Billeteras.First(billetera => billetera.UsuarioId == comprador2.Id);

                // Subasta Activa estándar: Cierra en 25 min (líder $45.000)
                var subastaActivaEstandar = new Subasta
                {
                    VendedorId = vendedor.Id,
                    CategoriaId = categoriaTecno.Id,
                    Titulo = "Notebook",
                    Descripcion = "Subasta estándar para pruebas",
                    PrecioBase = 30000,
                    IncrementoMinimo = 5000,
                    FechaInicio = fechaActual.AddHours(-1),
                    FechaFin = fechaActual.AddMinutes(25),
                    Estado = "ACTIVA",
                    Version = 1
                };

                // Subasta Activa crítica: Cierra en menos de 2 min
                var subastaActivaCritica = new Subasta
                {
                    VendedorId = vendedor.Id,
                    CategoriaId = categoriaTecno.Id,
                    Titulo = "Samsung Galaxy A17",
                    Descripcion = "Subasta crítica anti-sniping",
                    PrecioBase = 50000,
                    IncrementoMinimo = 2000,
                    FechaInicio = fechaActual.AddHours(-1),
                    FechaFin = fechaActual.AddMinutes(2),
                    Estado = "ACTIVA",
                    Version = 1
                };

                // Subasta Próxima: Inicio programado a +24 hs
                var subastaProxima = new Subasta
                {
                    VendedorId = vendedor.Id,
                    CategoriaId = categoriaAutos.Id,
                    Titulo = "Sandero 2023",
                    Descripcion = "Inicio programado",
                    PrecioBase = 1000000,
                    IncrementoMinimo = 50000,
                    FechaInicio = fechaActual.AddDays(1),
                    FechaFin = fechaActual.AddDays(2),
                    Estado = "PROGRAMADA",
                    Version = 1
                };

                // Subasta Vencida con ganador
                var subastaVencidaGanador = new Subasta
                {
                    VendedorId = vendedor.Id,
                    CategoriaId = categoriaColeccionables.Id,
                    Titulo = "Moneda antigua de colección",
                    Descripcion = "Subasta finalizada con oferta ganadora",
                    PrecioBase = 10000,
                    IncrementoMinimo = 1000,
                    FechaInicio = fechaActual.AddDays(-2),
                    FechaFin = fechaActual.AddDays(-1),
                    Estado = "FINALIZADA",
                    Version = 1
                };

                // Subasta vencida desierta
                var subastaVencidaDesierta = new Subasta
                {
                    VendedorId = vendedor.Id,
                    CategoriaId = categoriaColeccionables.Id,
                    Titulo = "Cuadro Antiguo",
                    Descripcion = "Subasta finalizada sin ofertas",
                    PrecioBase = 80000,
                    IncrementoMinimo = 5000,
                    FechaInicio = fechaActual.AddDays(-2),
                    FechaFin = fechaActual.AddDays(-1),
                    Estado = "FINALIZADA",
                    Version = 1
                };

                context.Subastas.AddRange(
                    subastaActivaEstandar,
                    subastaActivaCritica,
                    subastaProxima,
                    subastaVencidaGanador,
                    subastaVencidaDesierta
                );
                context.SaveChanges();

                // PUJAS Y REGISTROS 
                
                // Puja 1: Comprador 2 oferta $40.000
                var puja1 = new Puja
                {
                    SubastaId = subastaActivaEstandar.Id,
                    CompradorId = comprador2.Id,
                    Monto = 40000,
                    FechaPuja = fechaActual.AddMinutes(-40)
                };

                // Puja 2: Comprador 1 supera con $45.000 (actual líder)
                var puja2 = new Puja
                {
                    SubastaId = subastaActivaEstandar.Id,
                    CompradorId = comprador1.Id,
                    Monto = 45000,
                    FechaPuja = fechaActual.AddMinutes(-20)
                };

                // Puja en la subasta vencida con ganador
                var pujaGanadora = new Puja
                {
                    SubastaId = subastaVencidaGanador.Id,
                    CompradorId = comprador1.Id,
                    Monto = 15000,
                    FechaPuja = fechaActual.AddDays(-1).AddMinutes(-30)
                };

                context.Pujas.AddRange(puja1, puja2, pujaGanadora);
                context.SaveChanges();
                
            }
            // SEED DE TRANSACCIONES LEDGER 
            if (!context.TransaccionesLedger.Any()) 
            {
                var subastaActivaEstandar = context.Subastas.First(s => s.Titulo == "Notebook");
                var comprador1 = context.Usuarios.First(u => u.Email == "comprador1@test.com");
                var comprador2 = context.Usuarios.First(u => u.Email == "comprador2@test.com");

                var billeteraComprador1 = context.Billeteras.First(b => b.UsuarioId == comprador1.Id);
                var billeteraComprador2 = context.Billeteras.First(b => b.UsuarioId == comprador2.Id);

                var fechaActual = DateTime.UtcNow;

                var transacciones = new List<TransaccionLedger>
                {
                    new TransaccionLedger
                    {
                        BilleteraId = billeteraComprador1.Id,
                        SubastaId = subastaActivaEstandar.Id,
                        Tipo = "RETENCION_PUJA",
                        Monto = 45000,
                        Fecha = fechaActual.AddMinutes(-20)
                    },
                    new TransaccionLedger
                    {
                        BilleteraId = billeteraComprador1.Id,
                        SubastaId = null,
                        Tipo = "DEPOSITO",
                        Monto = 150000,
                        Fecha = fechaActual.AddHours(-2)
                    },
                    new TransaccionLedger
                    {
                        BilleteraId = billeteraComprador2.Id,
                        SubastaId = null,
                        Tipo = "DEPOSITO",
                        Monto = 200000,
                        Fecha = fechaActual.AddHours(-2)
                    }
                };

                context.TransaccionesLedger.AddRange(transacciones); 
                context.SaveChanges();
            }
        }
    }
}