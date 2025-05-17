using BenefitsAdmin.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddGrpc();
builder.Services.AddCustomHealthChecks(); // Add our custom health checks

// Register HTTP client for API Gateway communication
builder.Services.AddHttpClient("ApiGateway", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ApiGatewayUrl"] ?? "http://localhost:3000");
});

// Register singletons for state management
builder.Services.AddSingleton<TaxRateManager>();
builder.Services.AddSingleton<PaymentManager>();
builder.Services.AddSingleton<EventBusService>();

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseCustomHealthChecks(); // Use our custom health checks
app.MapGrpcService<BenefitsService>();
app.MapGet("/", () => "Benefits Administration Service - Communication with this gRPC service must be made through a gRPC client.");

// Subscribe to events at startup
app.Lifetime.ApplicationStarted.Register(async () =>
{
    try
    {
        var eventBusService = app.Services.GetRequiredService<EventBusService>();
        await eventBusService.SubscribeToEvents();
        Console.WriteLine("Successfully subscribed to Event Bus");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Failed to subscribe to Event Bus: {ex.Message}");
    }
});

app.Run();