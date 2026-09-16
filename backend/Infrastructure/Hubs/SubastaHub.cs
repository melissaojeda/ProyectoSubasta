using Microsoft.AspNetCore.SignalR;

namespace Infrastructure.Hubs
{
    public class SubastaHub : Hub
    {
        public async Task UnirseASubasta(string subastaId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, subastaId);
        }

        public async Task SalirDeSubasta(string subastaId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, subastaId);
        }
    }
}