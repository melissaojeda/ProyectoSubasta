
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Application.DTOs.Categoria;
using Application.DTOs.Subasta;
using Application.DTOs.Usuario;
using Application.DTOs.Billetera;
using Application.DTOs.Puja;
using Application.UseCases.Pujas;
using Application.IRepository.ICommand;
using Application.IRepository.IQuery;
using Application.UseCases.Subastas;
using Domain.Entities;
using Xunit;

namespace SubastaYa.Tests;

public class CrearSubastaUseCaseTests
{
    [Theory]
    [InlineData(999, 1, "La categoría seleccionada no existe.")]
    [InlineData(1, 999, "El vendedor indicado no existe.")]
    public async Task ReferenciaInexistente_RechazaLaCreacion(
        int categoriaId, int vendedorId, string mensajeEsperado)
    {
        var repositorio = new SubastaCommandPrueba();
        var casoDeUso = CrearCasoDeUso(repositorio);
        var dto = CrearDtoValido();
        dto.CategoriaId = categoriaId;
        dto.VendedorId = vendedorId;

        var excepcion = await Assert.ThrowsAsync<ArgumentException>(
            () => casoDeUso.EjecutarAsync(dto));

        Assert.Equal(mensajeEsperado, excepcion.Message);
        Assert.Equal(0, repositorio.CantidadCreaciones);
    }

    [Fact]
    public async Task DatosValidos_PermitenCrearLaSubasta()
    {
        var repositorio = new SubastaCommandPrueba();
        var casoDeUso = CrearCasoDeUso(repositorio);
        var dto = CrearDtoValido();
        dto.Titulo = "  Subasta de prueba  ";

        await casoDeUso.EjecutarAsync(dto);

        Assert.Equal(1, repositorio.CantidadCreaciones);
        Assert.Equal("Subasta de prueba", repositorio.UltimaSubasta?.Titulo);
    }

    [Fact]
    public async Task IncrementoInsuficiente_RechazaLaCreacion()
    {
        var repositorio = new SubastaCommandPrueba();
        var casoDeUso = CrearCasoDeUso(repositorio);
        var dto = CrearDtoValido();
        dto.IncrementoMinimo = 500m;

        var excepcion = await Assert.ThrowsAsync<ArgumentException>(
            () => casoDeUso.EjecutarAsync(dto));

        Assert.Equal("El incremento mínimo debe ser de al menos $1000.",
            excepcion.Message);
        Assert.Equal(0, repositorio.CantidadCreaciones);
    }

    private static CrearSubastaUseCase CrearCasoDeUso(
        SubastaCommandPrueba repositorio)
    {
        return new CrearSubastaUseCase(
            repositorio,
            new UsuarioQueryPrueba(),
            new CategoriaQueryPrueba());
    }

    private static CreateSubastaDTO CrearDtoValido()
    {
        var inicio = DateTime.UtcNow.AddDays(2);

        return new CreateSubastaDTO
        {
            VendedorId = 1,
            CategoriaId = 1,
            Titulo = "Subasta de prueba",
            Descripcion = "Descripción para las pruebas",
            UrlImagen = "https://example.com/imagen.jpg",
            PrecioBase = 1000m,
            IncrementoMinimo = 1000m,
            FechaInicio = inicio,
            FechaFin = inicio.AddDays(1)
        };
    }

    private sealed class SubastaCommandPrueba : ISubastaCommand
    {
        public int CantidadCreaciones { get; private set; }
        public CreateSubastaDTO? UltimaSubasta { get; private set; }

        public Task CreateAsync(CreateSubastaDTO dto)
        {
            CantidadCreaciones++;
            UltimaSubasta = dto;
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Subasta subasta) =>
            throw new NotSupportedException();

        public Task DeleteAsync(Subasta subasta) =>
            throw new NotSupportedException();

        public Task SaveChangesAsync() =>
            throw new NotSupportedException();
    }

    private sealed class UsuarioQueryPrueba : IUsuarioQuery
    {
        public Task<GetUsuarioDTO?> GetByIdAsync(int id)
        {
            GetUsuarioDTO? usuario = id == 1
                ? new GetUsuarioDTO { Id = 1 }
                : null;

            return Task.FromResult(usuario);
        }

        public Task<IEnumerable<GetUsuarioDTO>> GetAllAsync() =>
            Task.FromResult<IEnumerable<GetUsuarioDTO>>(
                Array.Empty<GetUsuarioDTO>());

        public Task<GetUsuarioDTO?> LoginAsync(
            string email, string password) =>
            Task.FromResult<GetUsuarioDTO?>(null);
    }

    private sealed class CategoriaQueryPrueba : ICategoriaQuery
    {
        public Task<GetCategoriaDTO?> GetByIdAsync(int id)
        {
            GetCategoriaDTO? categoria = id == 1
                ? new GetCategoriaDTO { Id = 1 }
                : null;

            return Task.FromResult(categoria);
        }

        public Task<IEnumerable<GetCategoriaDTO>> GetAllAsync() =>
            Task.FromResult<IEnumerable<GetCategoriaDTO>>(
                Array.Empty<GetCategoriaDTO>());
    }

    public class CrearPujaUseCaseTests
    {
        private readonly PujaCommandSimulado _comando = new();
        private readonly SubastaQuerySimulada _subastas = new();
        private readonly BilleteraQuerySimulada _billeteras = new();
        private readonly AuditoriaCommandSimulada _auditorias = new();

        private CrearPujaUseCase CasoDeUso() =>
            new(_comando, _subastas, _billeteras, _auditorias);

        [Fact]
        public async Task SubastaInexistente_DevuelveRecursoNoEncontrado()
        {
            _subastas.Subasta = null;

            await Assert.ThrowsAsync<KeyNotFoundException>(() =>
                CasoDeUso().EjecutarAsync(
                    999,
                    new CreatePujaDTO
                    {
                        CompradorId = 2,
                        Monto = 1000
                    }));

            Assert.Equal(0, _comando.CantidadCreaciones);
        }

        [Fact]
        public async Task VendedorNoPuedePujar()
        {
            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                CasoDeUso().EjecutarAsync(
                    1,
                    new CreatePujaDTO
                    {
                        CompradorId = 1,
                        Monto = 1000
                    }));

            Assert.Equal("RECHAZADA_VENDEDOR", _auditorias.UltimaAccion);
            Assert.Equal(0, _comando.CantidadCreaciones);
        }

        [Fact]
        public async Task SubastaNoActiva_RechazaPuja()
        {
            _subastas.Subasta!.Estado = "PROGRAMADA";

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                CasoDeUso().EjecutarAsync(
                    1,
                    new CreatePujaDTO
                    {
                        CompradorId = 2,
                        Monto = 1000
                    }));

            Assert.Equal(
                "RECHAZADA_SUBASTA_NO_ACTIVA",
                _auditorias.UltimaAccion);
        }

        [Fact]
        public async Task IncrementoInsuficiente_RechazaPuja()
        {
            _subastas.Subasta!.MejorPuja = 2000;
            _subastas.Subasta.MejorPostorId = 3;

            await Assert.ThrowsAsync<ArgumentException>(() =>
                CasoDeUso().EjecutarAsync(
                    1,
                    new CreatePujaDTO
                    {
                        CompradorId = 2,
                        Monto = 2500
                    }));

            Assert.Equal(
                "RECHAZADA_MONTO_INSUFICIENTE",
                _auditorias.UltimaAccion);
        }

        [Fact]
        public async Task FondosInsuficientes_RechazaPuja()
        {
            _billeteras.Billetera!.SaldoDisponible = 100;

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                CasoDeUso().EjecutarAsync(
                    1,
                    new CreatePujaDTO
                    {
                        CompradorId = 2,
                        Monto = 1000
                    }));

            Assert.Equal(
                "RECHAZADA_FONDOS_INSUFICIENTES",
                _auditorias.UltimaAccion);
        }

        [Fact]
        public async Task LiderSoloNecesitaLaDiferenciaDeSaldo()
        {
            _subastas.Subasta!.MejorPuja = 2000;
            _subastas.Subasta.MejorPostorId = 2;
            _billeteras.Billetera!.SaldoDisponible = 1000;

            await CasoDeUso().EjecutarAsync(
                1,
                new CreatePujaDTO
                {
                    CompradorId = 2,
                    Monto = 3000
                });

            Assert.Equal(1, _comando.CantidadCreaciones);
            Assert.Null(_comando.NuevaFechaFin);
        }

        [Fact]
        public async Task UltimoMinuto_ActivaAntiSniping()
        {
            var finOriginal = DateTime.UtcNow.AddSeconds(30);
            _subastas.Subasta!.FechaFin = finOriginal;

            await CasoDeUso().EjecutarAsync(
                1,
                new CreatePujaDTO
                {
                    CompradorId = 2,
                    Monto = 1000
                });

            Assert.Equal(
                finOriginal.AddMinutes(2),
                _comando.NuevaFechaFin);

            Assert.Equal(1, _comando.CantidadCreaciones);
        }

        [Fact]
        public async Task SubastaVencida_RechazaPuja()
        {
            _subastas.Subasta!.FechaFin =
                DateTime.UtcNow.AddMinutes(-5);

            await Assert.ThrowsAsync<InvalidOperationException>(() =>
                CasoDeUso().EjecutarAsync(
                    1,
                    new CreatePujaDTO
                    {
                        CompradorId = 2,
                        Monto = 1000
                    }));

            Assert.Equal(
                "RECHAZADA_SUBASTA_FINALIZADA",
                _auditorias.UltimaAccion);
        }

        [Fact]
        public async Task MontoMayorAlMaximo_RechazaPuja()
        {
            await Assert.ThrowsAsync<ArgumentException>(() =>
                CasoDeUso().EjecutarAsync(
                    1,
                    new CreatePujaDTO
                    {
                        CompradorId = 2,
                        Monto = 100_000_000m
                    }));

            Assert.Equal(0, _comando.CantidadCreaciones);
        }

        [Fact]
        public async Task CompradorSinBilletera_RechazaPuja()
        {
            _billeteras.Billetera = null;

            await Assert.ThrowsAsync<ArgumentException>(() =>
                CasoDeUso().EjecutarAsync(
                    1,
                    new CreatePujaDTO
                    {
                        CompradorId = 2,
                        Monto = 1000
                    }));

            Assert.Equal(0, _comando.CantidadCreaciones);
        }

        [Fact]
        public async Task FueraDelUltimoMinuto_NoActivaAntiSniping()
        {
            _subastas.Subasta!.FechaFin =
                DateTime.UtcNow.AddMinutes(5);

            await CasoDeUso().EjecutarAsync(
                1,
                new CreatePujaDTO
                {
                    CompradorId = 2,
                    Monto = 1000
                });

            Assert.Null(_comando.NuevaFechaFin);
        }

        [Fact]
        public async Task VersionesConsultadas_SeTransmitenAlRepositorio()
        {
            await CasoDeUso().EjecutarAsync(
                1,
                new CreatePujaDTO
                {
                    CompradorId = 2,
                    Monto = 1000
                });

            Assert.Equal(3, _comando.VersionSubastaRecibida);
            Assert.Equal(1, _comando.VersionBilleteraRecibida);
            Assert.Equal(1, _comando.CantidadCreaciones);
        }

        private sealed class PujaCommandSimulado : IPujaCommand
        {
            public int CantidadCreaciones { get; private set; }
            public DateTime? NuevaFechaFin { get; private set; }
            public int? VersionSubastaRecibida { get; private set; }
            public int? VersionBilleteraRecibida { get; private set; }

            public Task CreateAsync(
                int subastaId,
                CreatePujaDTO dto,
                int versionSubastaEsperada,
                int versionBilleteraEsperada,
                DateTime? nuevaFechaFin)
            {
                VersionSubastaRecibida = versionSubastaEsperada;
                VersionBilleteraRecibida = versionBilleteraEsperada;
                NuevaFechaFin = nuevaFechaFin;
                CantidadCreaciones++;

                return Task.CompletedTask;
            }

            public Task SaveChangesAsync() =>
                Task.CompletedTask;
        }

        private sealed class AuditoriaCommandSimulada : IAuditoriaLogCommand
        {
            public string? UltimaAccion { get; private set; }

            public Task CreateAsync(AuditoriaLog log)
            {
                UltimaAccion = log.Accion;
                return Task.CompletedTask;
            }

            public Task SaveChangesAsync() =>
                Task.CompletedTask;
        }

        private sealed class SubastaQuerySimulada : ISubastaQuery
        {
            public GetSubastaDTO? Subasta { get; set; } = new()
            {
                Id = 1,
                VendedorId = 1,
                Estado = "ACTIVA",
                Version = 3,
                PrecioBase = 1000,
                IncrementoMinimo = 1000,
                FechaInicio = DateTime.UtcNow.AddHours(-1),
                FechaFin = DateTime.UtcNow.AddHours(1)
            };

            public Task<GetSubastaDTO?> GetByIdAsync(int id) =>
                Task.FromResult(id == 1 ? Subasta : null);

            public Task<IEnumerable<GetSubastaDTO>> GetAllAsync() =>
                Vacia();

            public Task<IEnumerable<GetSubastaDTO>> GetByEstadoAsync(
                string estado) => Vacia();

            public Task<IEnumerable<GetSubastaDTO>> GetByCategoriaAsync(
                int categoriaId) => Vacia();

            public Task<IEnumerable<GetSubastaDTO>> GetByVendedorIdAsync(
                int vendedorId) => Vacia();

            public Task<IEnumerable<GetSubastaDTO>> GetFiltradasAsync(
                string? estado,
                int? categoriaId,
                decimal? precioMin,
                decimal? precioMax,
                string? orden,
                int pagina,
                int tamanioPagina) => Vacia();

            private static Task<IEnumerable<GetSubastaDTO>> Vacia() =>
                Task.FromResult<IEnumerable<GetSubastaDTO>>(
                    Array.Empty<GetSubastaDTO>());
        }

        private sealed class BilleteraQuerySimulada : IBilleteraQuery
        {
            public GetBilleteraDTO? Billetera { get; set; } = new()
            {
                Id = 2,
                UsuarioId = 2,
                SaldoTotal = 10000,
                SaldoDisponible = 10000,
                SaldoRetenido = 0,
                Version = 1
            };

            public Task<GetBilleteraDTO?> GetByIdAsync(int id) =>
                Task.FromResult(id == 2 ? Billetera : null);

            public Task<GetBilleteraDTO?> GetByUsuarioIdAsync(
                int usuarioId) =>
                Task.FromResult(usuarioId == 2 ? Billetera : null);
        }
    }
}
