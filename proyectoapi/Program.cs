using Microsoft.EntityFrameworkCore;
using Infrastructure.Datos; 

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

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
