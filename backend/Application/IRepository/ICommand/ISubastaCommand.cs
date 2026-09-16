using Application.DTOs.Subasta;
using Domain;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.IRepository.ICommand
{
    public interface ISubastaCommand
    {
        Task CreateAsync(CreateSubastaDTO dto);
        Task UpdateAsync(Subasta subasta);
        Task DeleteAsync(Subasta subasta);
        Task SaveChangesAsync();
    }
}