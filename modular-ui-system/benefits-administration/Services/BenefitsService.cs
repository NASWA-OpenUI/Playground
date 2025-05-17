using BenefitsAdmin.Protos;
using Grpc.Core;

namespace BenefitsAdmin.Services
{
    public class BenefitsService : Protos.BenefitsService.BenefitsServiceBase
    {
        private readonly ILogger<BenefitsService> _logger;
        private readonly TaxRateManager _taxRateManager;
        private readonly PaymentManager _paymentManager;

        public BenefitsService(ILogger<BenefitsService> logger, TaxRateManager taxRateManager, PaymentManager paymentManager)
        {
            _logger = logger;
            _taxRateManager = taxRateManager;
            _paymentManager = paymentManager;
        }

        public override Task<PaymentResponse> ProcessPayment(PaymentRequest request, ServerCallContext context)
        {
            _logger.LogInformation($"Processing payment for claim {request.ClaimId}");

            // Create payment record
            var payment = _paymentManager.CreatePayment(request.ClaimId, request.Amount);

            // Return response
            return Task.FromResult(new PaymentResponse
            {
                PaymentId = payment.PaymentId,
                Status = payment.Status,
                Amount = payment.Amount,
                Date = payment.Date,
                Method = payment.Method
            });
        }

        public override Task<PaymentHistoryResponse> GetPaymentHistory(PaymentHistoryRequest request, ServerCallContext context)
        {
            _logger.LogInformation($"Getting payment history for claim {request.ClaimId}");

            // Get payment history
            var payments = _paymentManager.GetPaymentHistory(request.ClaimId);

            // Calculate total paid
            var totalPaid = payments.Sum(p => p.Amount);

            // Create response
            var response = new PaymentHistoryResponse
            {
                TotalPaid = totalPaid
            };

            // Add payment records
            foreach (var payment in payments)
            {
                response.Payments.Add(new PaymentRecord
                {
                    PaymentId = payment.PaymentId,
                    ClaimId = payment.ClaimId,
                    Amount = payment.Amount,
                    Date = payment.Date,
                    Status = payment.Status,
                    Method = payment.Method
                });
            }

            return Task.FromResult(response);
        }

        public override Task<TaxRateResponse> UpdateTaxRate(TaxRateRequest request, ServerCallContext context)
        {
            _logger.LogInformation($"Updating tax rate to {request.NewRate}");

            // Update tax rate
            var success = _taxRateManager.UpdateRate(request.NewRate);

            return Task.FromResult(new TaxRateResponse
            {
                Success = success,
                Message = success ? $"Tax rate updated to {request.NewRate}" : "Failed to update tax rate",
                CurrentRate = _taxRateManager.GetCurrentRate()
            });
        }

        public override Task<TaxRateInfoResponse> GetTaxRate(TaxRateInfoRequest request, ServerCallContext context)
        {
            _logger.LogInformation("Getting current tax rate");

            return Task.FromResult(new TaxRateInfoResponse
            {
                CurrentRate = _taxRateManager.GetCurrentRate(),
                LastUpdated = _taxRateManager.GetLastUpdated()
            });
        }
    }
}