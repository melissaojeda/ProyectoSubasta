using Microsoft.EntityFrameworkCore;
using Infrastructure.Datos; 
using Application.IRepository.ICommand;
using Application.IRepository.IQuery;
using Infrastructure.Repository.Command;
using Infrastructure.Repository.Query;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IBilleteraCommand, BilleteraCommand>();
builder.Services.AddScoped<IBilleteraQuery, BilleteraQuery>();
builder.Services.AddHostedService<Infrastructure.SubastaWorker>();

builder.Services.AddScoped<IPujaCommand, PujaCommand>();
builder.Services.AddScoped<IPujaQuery, PujaQuery>();

builder.Services.AddScoped<ISubastaCommand, SubastaCommand>();
builder.Services.AddScoped<ISubastaQuery, SubastaQuery>();
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseMiddleware<proyectoapi.Middlewares.ManejoExcepcionesMiddleware>();

app.UseAuthorization();

app.MapControllers();

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
