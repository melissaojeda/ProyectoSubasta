using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Billetera;
using Application.IRepository.ICommand;
using Domain.Entities;
using Infrastructure.Datos;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repository.Command
{
    public class BilleteraCommand : IBilleteraCommand
    {
        private readonly AppDbContext _context;

        public BilleteraCommand(AppDbContext context)
        {
            _context = context;
        }

        public async Task CreateAsync(Billetera billetera)
        {
            await _context.Billeteras.AddAsync(billetera);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Billetera billetera)
        {
            _context.Billeteras.Update(billetera);
            await _context.SaveChangesAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}