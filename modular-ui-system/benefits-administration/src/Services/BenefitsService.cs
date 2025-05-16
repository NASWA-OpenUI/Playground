using Grpc.Core;
using BenefitsAdmin.Protos;

namespace BenefitsAdmin.Services;

/// <summary>
/// gRPC service implementation for Benefits Administration
/// </summary>
public class BenefitsService : Protos.BenefitsService.BenefitsServiceBase
{
    private readonly ILogger<BenefitsService> _logger;
    private readonly TaxRateManager _taxRateManager;
    private readonly PaymentManager _paymentManager;
    private readonly EventBusService _eventBusService;

    public BenefitsService(
        ILogger<BenefitsService> logger,
        TaxRateManager taxRateManager,
        PaymentManager paymentManager,
        EventBusService eventBusService)
    {
        _logger = logger;
        _taxRateManager = taxRateManager;
        _paymentManager = paymentManager;
        _eventBusService = eventBusService;
    }

    /// <summary>
    /// Process a payment for a claim
    /// </summary>
    public override async Task<PaymentResponse> ProcessPayment(PaymentRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Processing payment for claim {ClaimId} with amount {Amount}", request.ClaimId, request.Amount);

        try
        {
            // Process the payment
            var payment = _paymentManager.CreatePayment(request.ClaimId, request.Amount, request.PaymentType);

            // Publish payment processed event
            await _eventBusService.PublishEvent("payment.processed", new
            {
                claimId = request.ClaimId,
                paymentId = payment.PaymentId,
                amount = payment.Amount,
                date = payment.Date,
                status = payment.Status
            });

            // Return payment details
            return new PaymentResponse
            {
                PaymentId = payment.PaymentId,
                Status = payment.Status,
                Amount = payment.Amount,
                Date = payment.Date,
                Method = payment.Method
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment for claim {ClaimId}", request.ClaimId);
            throw new RpcException(new Status(StatusCode.Internal, $"Error processing payment: {ex.Message}"));
        }
    }

    /// <summary>
    /// Get payment history for a claim
    /// </summary>
    public override Task<PaymentHistoryResponse> GetPaymentHistory(PaymentHistoryRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Getting payment history for claim {ClaimId}", request.ClaimId);

        try
        {
            // Get payment history for the claim
            var payments = _paymentManager.GetPaymentHistory(request.ClaimId);

            // Calculate total paid
            var totalPaid = payments.Sum(p => p.Amount);

            // Create payment records for response
            var paymentRecords = payments.Select(p => new PaymentRecord
            {
                PaymentId = p.PaymentId,
                ClaimId = p.ClaimId,
                Amount = p.Amount,
                Date = p.Date,
                Status = p.Status,
                Method = p.Method
            });

            // Return payment history
            var response = new PaymentHistoryResponse
            {
                TotalPaid = totalPaid
            };
            response.Payments.AddRange(paymentRecords);

            return Task.FromResult(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment history for claim {ClaimId}", request.ClaimId);
            throw new RpcException(new Status(StatusCode.Internal, $"Error getting payment history: {ex.Message}"));
        }
    }

    /// <summary>
    /// Update tax rate for benefit calculations
    /// </summary>
    public override async Task<TaxRateResponse> UpdateTaxRate(TaxRateRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Updating tax rate to {NewRate}", request.NewRate);

        try
        {
            // Validate tax rate
            if (request.NewRate < 0 || request.NewRate > 1)
            {
                return new TaxRateResponse
                {
                    Success = false,
                    Message = "Tax rate must be between 0 and 1",
                    CurrentRate = _taxRateManager.GetCurrentRate()
                };
            }

            // Update tax rate
            _taxRateManager.UpdateRate(request.NewRate);

            // Publish tax rate updated event
            await _eventBusService.PublishEvent("taxrate.updated", new
            {
                oldRate = _taxRateManager.GetCurrentRate(),
                newRate = request.NewRate
            });

            return new TaxRateResponse
            {
                Success = true,
                Message = $"Tax rate updated to {request.NewRate}",
                CurrentRate = request.NewRate
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tax rate");
            throw new RpcException(new Status(StatusCode.Internal, $"Error updating tax rate: {ex.Message}"));
        }
    }

    /// <summary>
    /// Get current tax rate information
    /// </summary>
    public override Task<TaxRateInfoResponse> GetTaxRate(TaxRateInfoRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Getting current tax rate");

        try
        {
            return Task.FromResult(new TaxRateInfoResponse
            {
                CurrentRate = _taxRateManager.GetCurrentRate(),
                LastUpdated = _taxRateManager.GetLastUpdated()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tax rate");
            throw new RpcException(new Status(StatusCode.Internal, $"Error getting tax rate: {ex.Message}"));
        }
    }
}