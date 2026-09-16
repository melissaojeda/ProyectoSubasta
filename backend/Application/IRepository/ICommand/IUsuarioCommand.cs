using Application.DTOs.Usuario;
using Domain;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.IRepository.ICommand
{
    public interface IUsuarioCommand
    {
        Task CreateAsync(CreateUsuarioDTO dto);
        Task UpdateAsync(UpdateUsuarioDTO dto);
        Task DeleteAsync(Usuario usuario);
        Task SaveChangesAsync();
    }
}