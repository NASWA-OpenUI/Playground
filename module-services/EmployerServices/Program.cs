using Microsoft.EntityFrameworkCore;
using EmployerServices.Data;
using EmployerServices.Services;
using EmployerServices.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))));

builder.Services.AddControllers();
builder.Services.AddSignalR();

// HTTP Client for Camel Gateway
builder.Services.AddHttpClient<ICamelGatewayService, CamelGatewayService>();

// Custom services
builder.Services.AddSingleton<IArtemisService, ArtemisService>();
builder.Services.AddScoped<IClaimImportService, ClaimImportService>(); // 🔥 Added this line
builder.Services.AddHostedService<EmployerServicesBackgroundService>();

// SPA Configuration
builder.Services.AddSpaStaticFiles(configuration =>
{
    configuration.RootPath = "ClientApp/build";
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseSpaStaticFiles();

app.UseRouting();

app.MapControllers();
app.MapHub<ClaimHub>("/claimhub");

app.UseSpa(spa =>
{
    spa.Options.SourcePath = "ClientApp";
    
    if (app.Environment.IsDevelopment())
    {
        spa.UseProxyToSpaDevelopmentServer("http://localhost:3000");
    }
});

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
}

app.Run();