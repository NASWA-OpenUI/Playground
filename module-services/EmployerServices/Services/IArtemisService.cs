namespace EmployerServices.Services
{
    public interface IArtemisService
    {
        Task StartAsync();
        Task StopAsync();
        event EventHandler<string>? MessageReceived;
    }
}