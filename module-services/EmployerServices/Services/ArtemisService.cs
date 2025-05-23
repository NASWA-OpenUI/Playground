using Apache.NMS;
using Apache.NMS.ActiveMQ;
using Newtonsoft.Json;
using EmployerServices.Models;

namespace EmployerServices.Services
{
    public class ArtemisService : IArtemisService, IDisposable
    {
        private readonly IConfiguration _config;
        private readonly ILogger<ArtemisService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private IConnection? _connection;
        private Apache.NMS.ISession? _session;
        private IMessageConsumer? _consumer;
        
        public event EventHandler<string>? MessageReceived;
        
        public ArtemisService(IConfiguration config, ILogger<ArtemisService> logger, IServiceProvider serviceProvider)
        {
            _config = config;
            _logger = logger;
            _serviceProvider = serviceProvider;
        }
        
        public async Task StartAsync()
        {
            try
            {
                // Use OpenWire protocol (ActiveMQ native) instead of AMQP
                var brokerUrl = _config["Artemis:BrokerUrl"];
                var factory = new ConnectionFactory(brokerUrl);
                
                _connection = await factory.CreateConnectionAsync(
                    _config["Artemis:Username"], 
                    _config["Artemis:Password"]);
                
                _session = await _connection.CreateSessionAsync();
                var topic = await _session.GetTopicAsync(_config["Artemis:TopicName"]);
                
                // Filter for messages related to employer verification
                _consumer = await _session.CreateConsumerAsync(topic, 
                    "newStatus = 'AWAITING_EMPLOYER' OR newStatus = 'AWAITING_TAX_CALC'");
                
                _consumer.Listener += OnMessage;
                await _connection.StartAsync();
                
                _logger.LogInformation("Artemis service started successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to start Artemis service");
                throw;
            }
        }
        
        public async Task StopAsync()
        {
            try
            {
                if (_consumer != null)
                {
                    _consumer.Listener -= OnMessage;
                    await _consumer.CloseAsync();
                }
                
                if (_session != null)
                    await _session.CloseAsync();
                    
                if (_connection != null)
                    await _connection.CloseAsync();
                    
                _logger.LogInformation("Artemis service stopped");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping Artemis service");
            }
        }
        
        private async void OnMessage(IMessage message)
        {
            try
            {
                if (message is ITextMessage textMessage)
                {
                    _logger.LogInformation($"Received message: {textMessage.Text}");
                    
                    // Parse the event
                    var eventData = JsonConvert.DeserializeObject<ClaimStatusEvent>(textMessage.Text);
                    
                    if (eventData != null && eventData.NewStatus == "AWAITING_EMPLOYER")
                    {
                        _logger.LogInformation($"Processing AWAITING_EMPLOYER event for claim {eventData.ClaimReferenceId}");
                        
                        // Create a scope to get scoped services
                        using var scope = _serviceProvider.CreateScope();
                        var claimImportService = scope.ServiceProvider.GetRequiredService<IClaimImportService>();
                        
                        // Auto-import the claim to MySQL
                        var imported = await claimImportService.ImportClaimAsync(eventData.ClaimReferenceId);
                        
                        if (imported)
                        {
                            _logger.LogInformation($"Successfully auto-imported claim {eventData.ClaimReferenceId}");
                        }
                        else
                        {
                            _logger.LogError($"Failed to auto-import claim {eventData.ClaimReferenceId}");
                        }
                    }
                    
                    // Trigger the original event for any other listeners
                    MessageReceived?.Invoke(this, textMessage.Text);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message");
            }
        }
        
        public void Dispose()
        {
            StopAsync().Wait();
        }
    }
}