// Modules/benefits-admin/Services/BenefitsService.cs
using Grpc.Core;
using BenefitsAdministration.Protos;

namespace BenefitsAdministration.Services;

public class BenefitsService : Protos.BenefitsService.BenefitsServiceBase
{
    private readonly TaxRateService _taxRateService;
    private readonly ILogger<BenefitsService> _logger;

    public BenefitsService(TaxRateService taxRateService, ILogger<BenefitsService> logger)
    {
        _taxRateService = taxRateService;
        _logger = logger;
    }

    public override Task<BenefitCalculationResponse> CalculateBenefits(BenefitCalculationRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Calculating benefits for claim {ClaimId}", request.ClaimId);
        
        // Calculate total wages and weeks worked
        double totalWages = 0;
        int totalWeeks = 0;
        
        foreach (var employment in request.EmploymentHistory)
        {
            // Calculate weeks worked
            var startDate = DateTime.Parse(employment.StartDate);
            var endDate = DateTime.Parse(employment.EndDate);
            var daysWorked = (endDate - startDate).TotalDays;
            var weeksWorked = (int)Math.Round(daysWorked / 7);
            
            // Calculate weekly wage based on pay frequency
            double weeklyWage = 0;
            
            switch (employment.PayFrequency.ToLower())
            {
                case "hourly":
                    weeklyWage = employment.WageRate * (employment.HoursPerWeek > 0 ? employment.HoursPerWeek : 40);
                    break;
                case "weekly":
                    weeklyWage = employment.WageRate;
                    break;
                case "biweekly":
                    weeklyWage = employment.WageRate / 2;
                    break;
                case "monthly":
                    weeklyWage = (employment.WageRate * 12) / 52;
                    break;
                case "annually":
                    weeklyWage = employment.WageRate / 52;
                    break;
                default:
                    weeklyWage = 0;
                    break;
            }
            
            totalWages += weeklyWage * weeksWorked;
            totalWeeks += weeksWorked;
        }
        
        // Calculate average weekly wage
        double averageWeeklyWage = totalWeeks > 0 ? totalWages / totalWeeks : 0;
        
        // Weekly benefit amount (typically 50% of average weekly wage, capped)
        double weeklyBenefitAmount = Math.Min(averageWeeklyWage * 0.5, 500);
        
        // Maximum benefit amount (typically 26 weeks of benefits)
        double maximumBenefitAmount = weeklyBenefitAmount * 26;
        
        // Get tax rate
        double taxRate = _taxRateService.GetTaxRate("US-DEFAULT");
        
        // Calculate net weekly benefit amount
        double netWeeklyBenefitAmount = weeklyBenefitAmount * (1 - taxRate);
        
        // Set benefit year
        var now = DateTime.UtcNow;
        var benefitYearEnd = now.AddYears(1);
        
        return Task.FromResult(new BenefitCalculationResponse
        {
            ClaimId = request.ClaimId,
            WeeklyBenefitAmount = weeklyBenefitAmount,
            MaximumBenefitAmount = maximumBenefitAmount,
            BenefitYear = new BenefitYear
            {
                StartDate = now.ToString("yyyy-MM-dd"),
                EndDate = benefitYearEnd.ToString("yyyy-MM-dd")
            },
            TaxWithholdingRate = taxRate,
            NetWeeklyBenefitAmount = netWeeklyBenefitAmount
        });
    }

    public override Task<TaxRateResponse> GetTaxWithholdingRate(TaxRateRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Getting tax rate for state {StateCode}", request.StateCode);
        
        var taxRate = _taxRateService.GetTaxRate(request.StateCode);
        
        return Task.FromResult(new TaxRateResponse
        {
            TaxWithholdingRate = taxRate
        });
    }

    public override Task<TaxRateResponse> UpdateTaxWithholdingRate(UpdateTaxRateRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Updating tax rate for state {StateCode} to {NewRate}", request.StateCode, request.TaxWithholdingRate);
        
        _taxRateService.UpdateTaxRate(request.StateCode, request.TaxWithholdingRate);
        
        return Task.FromResult(new TaxRateResponse
        {
            TaxWithholdingRate = request.TaxWithholdingRate
        });
    }
}
