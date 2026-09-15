using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Application.DTOs.Puja;

namespace Application.IRepository.ICommand
{
    public interface IPujaCommand
    {
        Task CreateAsync(int subastaId, CreatePujaDTO dto);
        Task SaveChangesAsync();
    }
}