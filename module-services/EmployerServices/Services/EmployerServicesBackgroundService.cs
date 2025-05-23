using EmployerServices.Services;

namespace EmployerServices.Services
{
    public class EmployerServicesBackgroundService : BackgroundService
    {
        private readonly ICamelGatewayService _camelService;
        private readonly IArtemisService _artemisService;
        private readonly ILogger<EmployerServicesBackgroundService> _logger;
        private readonly IConfiguration _config;
        
        public EmployerServicesBackgroundService(
            ICamelGatewayService camelService,
            IArtemisService artemisService,
            ILogger<EmployerServicesBackgroundService> logger,
            IConfiguration config)
        {
            _camelService = camelService;
            _artemisService = artemisService;
            _logger = logger;
            _config = config;
        }
        
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Register with Camel Gateway
            await _camelService.RegisterServiceAsync();
            
            // Start Artemis connection
            await _artemisService.StartAsync();
            
            // Start heartbeat loop
            var heartbeatInterval = TimeSpan.FromSeconds(
                _config.GetValue<int>("CamelGateway:HeartbeatIntervalSeconds", 30));
            
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await _camelService.SendHeartbeatAsync();
                    await Task.Delay(heartbeatInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in background service");
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
            }
        }
    }
}