using Microsoft.EntityFrameworkCore;
using Infrastructure.Datos; 
using Application.IRepository.ICommand;
using Application.IRepository.IQuery;
using Infrastructure.Repository.Command;
using Infrastructure.Repository.Query;
using Microsoft.AspNetCore.SignalR;
using Infrastructure.Hubs;
using Application.UseCases.Pujas;
using Infrastructure;
using Application.UseCases.Billeteras;
using Application.UseCases.Subastas;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IBilleteraCommand, BilleteraCommand>();
builder.Services.AddScoped<IBilleteraQuery, BilleteraQuery>();

builder.Services.AddScoped<IPujaCommand, PujaCommand>();
builder.Services.AddScoped<IPujaQuery, PujaQuery>();

builder.Services.AddScoped<ISubastaCommand, SubastaCommand>();
builder.Services.AddScoped<ISubastaQuery, SubastaQuery>();

builder.Services.AddScoped<ICategoriaCommand, CategoriaCommand>();
builder.Services.AddScoped<ICategoriaQuery, CategoriaQuery>();

builder.Services.AddScoped<IUsuarioCommand, UsuarioCommand>();
builder.Services.AddScoped<IUsuarioQuery, UsuarioQuery>();

builder.Services.AddScoped<IAuditoriaLogCommand, AuditoriaLogCommand>();
builder.Services.AddScoped<IAuditoriaLogQuery, AuditoriaLogQuery>();

builder.Services.AddScoped<ITransaccionLedgerCommand, TransaccionLedgerCommand>();
builder.Services.AddScoped<ITransaccionLedgerQuery, TransaccionLedgerQuery>();
//casos de uso
builder.Services.AddScoped<ICrearPujaUseCase, CrearPujaUseCase>();
builder.Services.AddScoped<ICrearSubastaUseCase, CrearSubastaUseCase>();
builder.Services.AddScoped<IObtenerSubastasUseCase, ObtenerSubastasUseCase>();
builder.Services.AddScoped<IObtenerSubastaPorIdUseCase, ObtenerSubastaPorIdUseCase>();
builder.Services.AddScoped<IDepositarBilleteraUseCase, DepositarBilleteraUseCase>();

builder.Services.AddSignalR();
builder.Services.AddHostedService<SubastaWorker>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173") // Ajustar el puerto del frontend
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials(); 
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseMiddleware<proyectoapi.Middlewares.ManejoExcepcionesMiddleware>();

app.UseAuthorization();

app.MapControllers();

app.MapHub<Infrastructure.Hubs.SubastaHub>("/hubs/subasta");

using (var scope = app.Services.CreateScope())
{
    var servicios = scope.ServiceProvider;
    try
    {
        var context = servicios.GetRequiredService<AppDbContext>();
        DbInitializer.Seed(context);
        Console.WriteLine("--> Data Seeding ejecutado con éxito.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"--> Error en Data Seeding: {ex.Message}");
        if (ex.InnerException != null)
        {
            Console.WriteLine($"--> Detalle interno: {ex.InnerException.Message}");
        }
    }
}

app.Run();
