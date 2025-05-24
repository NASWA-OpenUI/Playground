using EmployerServices.Services;

namespace EmployerServices.Services
{
    public class EmployerServicesBackgroundService : BackgroundService
    {
        private readonly ICamelGatewayService _camelService;
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<EmployerServicesBackgroundService> _logger;
        private readonly IConfiguration _config;
        
        public EmployerServicesBackgroundService(
            ICamelGatewayService camelService,
            IServiceProvider serviceProvider,
            ILogger<EmployerServicesBackgroundService> logger,
            IConfiguration config)
        {
            _camelService = camelService;
            _serviceProvider = serviceProvider;
            _logger = logger;
            _config = config;
        }
        
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("🚀 EmployerServices background service starting...");
            
            // Register with Camel Gateway
            var registered = await _camelService.RegisterServiceAsync();
            if (!registered)
            {
                _logger.LogWarning("⚠️ Failed to register with Camel Gateway, but continuing...");
            }
            
            // Get intervals from config
            var heartbeatInterval = TimeSpan.FromSeconds(
                _config.GetValue<int>("CamelGateway:HeartbeatIntervalSeconds", 30));
            var pollingInterval = TimeSpan.FromSeconds(
                _config.GetValue<int>("ClaimPolling:IntervalSeconds", 30));
            
            // Track last poll time to avoid overlapping
            var lastPollTime = DateTime.MinValue;
            
            _logger.LogInformation("💓 Starting heartbeat and polling loops (intervals: {Heartbeat}s / {Polling}s)", 
                heartbeatInterval.TotalSeconds, pollingInterval.TotalSeconds);
            
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Send heartbeat every interval
                    await _camelService.SendHeartbeatAsync();
                    
                    // Poll for new claims if enough time has passed
                    if (DateTime.UtcNow - lastPollTime >= pollingInterval)
                    {
                        await PollForNewClaims();
                        lastPollTime = DateTime.UtcNow;
                    }
                    
                    await Task.Delay(heartbeatInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("🛑 Background service stopping...");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error in background service loop");
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
            }
            
            _logger.LogInformation("✅ EmployerServices background service stopped");
        }
        
        private async Task PollForNewClaims()
        {
            try
            {
                _logger.LogDebug("🔍 Polling for new claims...");
                
                // Get pending claims from Camel Gateway
                var pendingClaims = await _camelService.GetPendingClaimsAsync();
                
                if (pendingClaims.Any())
                {
                    _logger.LogInformation("📥 Found {Count} pending claims to process", pendingClaims.Count);
                    
                    // Create scope for scoped services
                    using var scope = _serviceProvider.CreateScope();
                    var claimImportService = scope.ServiceProvider.GetRequiredService<IClaimImportService>();
                    
                    foreach (var claim in pendingClaims)
                    {
                        try
                        {
                            // Check if already imported
                            if (await claimImportService.ClaimExistsAsync(claim.ClaimReferenceId))
                            {
                                _logger.LogDebug("⏭️ Claim {ClaimId} already imported, skipping", claim.ClaimReferenceId);
                                continue;
                            }
                            
                            // Import the claim
                            var imported = await claimImportService.ImportClaimAsync(claim.ClaimReferenceId);
                            
                            if (imported)
                            {
                                _logger.LogInformation("✅ Successfully imported claim {ClaimId}", claim.ClaimReferenceId);
                            }
                            else
                            {
                                _logger.LogError("❌ Failed to import claim {ClaimId}", claim.ClaimReferenceId);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "❌ Error processing claim {ClaimId}", claim.ClaimReferenceId);
                        }
                    }
                }
                else
                {
                    _logger.LogDebug("📭 No pending claims found");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error during claim polling");
            }
        }
    }
}
