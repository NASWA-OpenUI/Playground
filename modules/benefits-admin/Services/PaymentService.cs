using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using BenefitsAdmin.Models;

namespace BenefitsAdmin.Services
{
    public class PaymentService
    {
        private readonly ConcurrentDictionary<string, Payment> _payments = new();

        public Payment AuthorizePayment(PaymentAuthorizationRequest request)
        {
            var payment = new Payment
            {
                PaymentId = Guid.NewGuid().ToString(),
                ClaimId = request.ClaimId,
                ClaimantName = request.ClaimantName,
                WeeklyBenefitAmount = request.WeeklyBenefitAmount,
                TotalAuthorized = request.MaxBenefitAmount,
                Status = "AUTHORIZED",
                CreatedAt = DateTime.UtcNow,
                PaymentMethod = "Direct Deposit"
            };

            _payments.TryAdd(payment.PaymentId, payment);
            
            // Simulate processing delay
            Task.Run(async () =>
            {
                await Task.Delay(5000);
                payment.Status = "PROCESSED";
                payment.ProcessedAt = DateTime.UtcNow;
            });

            return payment;
        }

        public Payment GetPayment(string paymentId)
        {
            _payments.TryGetValue(paymentId, out var payment);
            return payment;
        }

        public IEnumerable<Payment> GetPaymentsByClaimId(string claimId)
        {
            return _payments.Values.Where(p => p.ClaimId == claimId);
        }

        public IEnumerable<Payment> GetAllPayments()
        {
            return _payments.Values;
        }
    }
}
