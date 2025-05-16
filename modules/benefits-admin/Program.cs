// Modules/benefits-admin/Program.cs
using BenefitsAdministration.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddGrpc();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

// Add singleton for the tax rate service
builder.Services.AddSingleton<TaxRateService>();

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseRouting();
app.UseCors("AllowAll");
app.UseGrpcWeb(new GrpcWebOptions { DefaultEnabled = true });

// Map the gRPC service
app.MapGrpcService<BenefitsService>().EnableGrpcWeb().RequireCors("AllowAll");

// Add a simple web interface
app.MapGet("/", () => "Benefits Administration gRPC Service");

// Add an endpoint for a simple web interface for tax rate management
app.MapGet("/tax-rate", async context =>
{
    var taxRateService = context.RequestServices.GetRequiredService<TaxRateService>();
    var taxRate = taxRateService.GetTaxRate("US-DEFAULT");
    
    await context.Response.WriteAsync($@"
    <!DOCTYPE html>
    <html>
    <head>
        <title>Benefits Administration - Tax Rate</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
            .container {{ max-width: 800px; margin: 0 auto; }}
            h1 {{ color: #2c3e50; }}
            .card {{ border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; }}
            .form-group {{ margin-bottom: 15px; }}
            label {{ display: block; margin-bottom: 5px; font-weight: bold; }}
            input {{ width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }}
            button {{ background-color: #3498db; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }}
            .alert {{ padding: 10px; border-radius: 4px; margin-bottom: 15px; }}
            .alert-success {{ background-color: #d4edda; color: #155724; }}
        </style>
    </head>
    <body>
        <div class=""container"">
            <h1>Benefits Administration</h1>
            
            <div class=""card"">
                <h2>Tax Withholding Rate Management</h2>
                <div id=""update-success"" class=""alert alert-success"" style=""display: none;"">
                    Tax rate updated successfully!
                </div>
                <div class=""form-group"">
                    <label for=""tax-rate"">Current Tax Withholding Rate:</label>
                    <input type=""number"" id=""tax-rate"" name=""tax-rate"" step=""0.01"" value=""{taxRate}"" />
                </div>
                <button id=""update-btn"">Update Tax Rate</button>
            </div>
        </div>
        
        <script>
            document.getElementById('update-btn').addEventListener('click', async function() {{
                const taxRate = document.getElementById('tax-rate').value;
                
                try {{
                    const response = await fetch('/api/tax-rate', {{
                        method: 'POST',
                        headers: {{
                            'Content-Type': 'application/json'
                        }},
                        body: JSON.stringify({{
                            stateCode: 'US-DEFAULT',
                            taxRate: parseFloat(taxRate)
                        }})
                    }});
                    
                    if (response.ok) {{
                        document.getElementById('update-success').style.display = 'block';
                        setTimeout(() => {{
                            document.getElementById('update-success').style.display = 'none';
                        }}, 3000);
                    }} else {{
                        alert('Failed to update tax rate');
                    }}
                }} catch (error) {{
                    console.error('Error:', error);
                    alert('An error occurred while updating the tax rate');
                }}
            }});
        </script>
    </body>
    </html>
    ");
});

// Add a simple API endpoint for updating tax rate
app.MapPost("/api/tax-rate", async (HttpContext context) =>
{
    var taxRateService = context.RequestServices.GetRequiredService<TaxRateService>();
    
    using var reader = new StreamReader(context.Request.Body);
    var requestBody = await reader.ReadToEndAsync();
    var data = System.Text.Json.JsonDocument.Parse(requestBody);
    
    var stateCode = data.RootElement.GetProperty("stateCode").GetString();
    var taxRate = data.RootElement.GetProperty("taxRate").GetDouble();
    
    taxRateService.UpdateTaxRate(stateCode, taxRate);
    
    context.Response.StatusCode = 200;
    await context.Response.WriteAsJsonAsync(new { success = true, newRate = taxRate });
});

app.Run();
