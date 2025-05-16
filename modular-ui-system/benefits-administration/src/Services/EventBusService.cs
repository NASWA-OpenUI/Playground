using System.Text;
using System.Text.Json;

namespace BenefitsAdmin.Services;

/// <summary>
/// Service for interacting with the Event Bus
/// </summary>
public class EventBusService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<EventBusService> _logger;

    public EventBusService(IHttpClientFactory httpClientFactory, ILogger<EventBusService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    /// <summary>
    /// Publishes an event to the Event Bus
    /// </summary>
    /// <param name="eventName">Name of the event</param>
    /// <param name="data">Event data</param>
    /// <returns>Task representing the asynchronous operation</returns>
    public async Task PublishEvent(string eventName, object data)
    {
        try
        {
            _logger.LogInformation("Publishing event {EventName}", eventName);
            
            var client = _httpClientFactory.CreateClient("ApiGateway");
            
            var content = new
            {
                eventName,
                data
            };
            
            var json = JsonSerializer.Serialize(content);
            var stringContent = new StringContent(json, Encoding.UTF8, "application/json");
            
            var response = await client.PostAsync("/api/events/publish", stringContent);
            response.EnsureSuccessStatusCode();
            
            _logger.LogInformation("Event {EventName} published successfully", eventName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error publishing event {EventName}", eventName);
            throw;
        }
    }

    /// <summary>
    /// Subscribes to events from the Event Bus
    /// </summary>
    /// <returns>Task representing the asynchronous operation</returns>
    public async Task SubscribeToEvents()
    {
        try
        {
            _logger.LogInformation("Subscribing to events");
            
            var client = _httpClientFactory.CreateClient("ApiGateway");
            
            // Subscribe to tax rate update events
            var taxRateSubscription = new
            {
                eventName = "taxrate.requested",
                callbackUrl = "http://localhost:3004/api/callbacks/taxrate-requested"
            };
            
            var json = JsonSerializer.Serialize(taxRateSubscription);
            var stringContent = new StringContent(json, Encoding.UTF8, "application/json");
            
            var response = await client.PostAsync("/api/events/subscribe", stringContent);
            response.EnsureSuccessStatusCode();
            
            _logger.LogInformation("Subscribed to events successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error subscribing to events");
            throw;
        }
    }
}