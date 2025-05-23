using Apache.NMS;
using Apache.NMS.ActiveMQ;
using Newtonsoft.Json;

namespace EmployerServices.Services
{
    public class ArtemisService : IArtemisService, IDisposable
    {
        private readonly IConfiguration _config;
        private readonly ILogger<ArtemisService> _logger;
        private IConnection? _connection;
        private Apache.NMS.ISession? _session;  // Fully qualified to avoid conflict
        private IMessageConsumer? _consumer;
        
        public event EventHandler<string>? MessageReceived;
        
        public ArtemisService(IConfiguration config, ILogger<ArtemisService> logger)
        {
            _config = config;
            _logger = logger;
        }
        
        public async Task StartAsync()
        {
            try
            {
                var factory = new ConnectionFactory(_config["Artemis:BrokerUrl"]);
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
        
        private void OnMessage(IMessage message)
        {
            try
            {
                if (message is ITextMessage textMessage)
                {
                    _logger.LogInformation($"Received message: {textMessage.Text}");
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