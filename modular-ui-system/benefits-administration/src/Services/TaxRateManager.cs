namespace BenefitsAdmin.Services;

/// <summary>
/// Manages tax rate for benefit calculations
/// </summary>
public class TaxRateManager
{
    private double _currentRate = 0.22; // Default tax rate
    private string _lastUpdated = DateTime.UtcNow.ToString("o");
    
    private readonly ILogger<TaxRateManager> _logger;

    public TaxRateManager(ILogger<TaxRateManager> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Updates the tax rate
    /// </summary>
    /// <param name="newRate">New tax rate (0-1)</param>
    /// <returns>True if successful</returns>
    public bool UpdateRate(double newRate)
    {
        if (newRate < 0 || newRate > 1)
        {
            _logger.LogWarning("Invalid tax rate: {NewRate}. Must be between 0 and 1", newRate);
            return false;
        }

        _currentRate = newRate;
        _lastUpdated = DateTime.UtcNow.ToString("o");
        
        _logger.LogInformation("Tax rate updated to {NewRate}", newRate);
        
        return true;
    }

    /// <summary>
    /// Gets the current tax rate
    /// </summary>
    /// <returns>Current tax rate</returns>
    public double GetCurrentRate()
    {
        return _currentRate;
    }

    /// <summary>
    /// Gets the last updated timestamp
    /// </summary>
    /// <returns>ISO 8601 timestamp of last update</returns>
    public string GetLastUpdated()
    {
        return _lastUpdated;
    }
}