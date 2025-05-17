// Simple Program.cs for Benefits Administration

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddHealthChecks();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Add health check endpoint
app.MapHealthChecks("/health");

// Add a simple API
app.MapGet("/", () => "Benefits Administration Service is running!");

// Simple Payment API
app.MapPost("/api/payments", async (HttpContext context) => {
    var request = await JsonSerializer.DeserializeAsync<PaymentRequest>(context.Request.Body);
    
    // Create a mock payment response
    var response = new PaymentResponse {
        PaymentId = Guid.NewGuid().ToString(),
        Amount = request.Amount,
        Status = "Processed",
        Date = DateTime.Now.ToString("o")
    };
    
    await JsonSerializer.SerializeAsync(context.Response.Body, response);
});

// Simple Tax Rate API
app.MapGet("/api/taxrate", async (HttpContext context) => {
    var response = new TaxRateResponse {
        CurrentRate = 0.22,
        LastUpdated = DateTime.Now.ToString("o")
    };
    
    await JsonSerializer.SerializeAsync(context.Response.Body, response);
});

app.Run();

// Simple model classes
public class PaymentRequest
{
    public string ClaimId { get; set; }
    public double Amount { get; set; }
}

public class PaymentResponse
{
    public string PaymentId { get; set; }
    public double Amount { get; set; }
    public string Status { get; set; }
    public string Date { get; set; }
}

public class TaxRateResponse
{
    public double CurrentRate { get; set; }
    public string LastUpdated { get; set; }
}