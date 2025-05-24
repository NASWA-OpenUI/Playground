using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using EmployerServices.Data;
using EmployerServices.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        MySqlServerVersion.LatestSupportedServerVersion));

// Add Razor Pages with anti-forgery disabled
builder.Services.AddRazorPages(options =>
{
    options.Conventions.ConfigureFilter(new IgnoreAntiforgeryTokenAttribute());
});

// HTTP Client for Camel Gateway
builder.Services.AddHttpClient<ICamelGatewayService, CamelGatewayService>();

// Custom services
builder.Services.AddScoped<IClaimImportService, ClaimImportService>();
builder.Services.AddHostedService<EmployerServicesBackgroundService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.MapRazorPages();

// Set default route to Dashboard
app.MapGet("/", () => Results.Redirect("/Dashboard"));

// Health check endpoint (keep this simple one for camel-gateway)
app.MapGet("/api/health", () => new
{
    status = "HEALTHY",
    timestamp = DateTime.UtcNow,
    service = "employer-services"
});

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
}

app.Run();
