// Modules/benefits-admin/Services/TaxRateService.cs
namespace BenefitsAdministration.Services;

public class TaxRateService
{
    private readonly Dictionary<string, double> _taxRates = new();
    private readonly ILogger<TaxRateService> _logger;

    public TaxRateService(ILogger<TaxRateService> logger)
    {
        _logger = logger;
        
        // Initialize with default rate
        _taxRates["US-DEFAULT"] = 0.1; // 10% default rate
    }

    public double GetTaxRate(string stateCode)
    {
        if (_taxRates.TryGetValue(stateCode, out double rate))
        {
            return rate;
        }
        
        return _taxRates["US-DEFAULT"];
    }

    public void UpdateTaxRate(string stateCode, double rate)
    {
        if (string.IsNullOrEmpty(stateCode))
        {
            stateCode = "US-DEFAULT";
        }
        
        _taxRates[stateCode] = rate;
        _logger.LogInformation("Tax rate for {StateCode} updated to {Rate}", stateCode, rate);
    }
}
