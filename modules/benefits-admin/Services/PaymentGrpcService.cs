using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using Grpc.Core;
using BenefitsAdmin.Protos;
// Use alias to avoid ambiguity
using DomainModels = BenefitsAdmin.Models;

namespace BenefitsAdmin.Services
{
    public class PaymentGrpcService : PaymentService.PaymentServiceBase
    {
        private readonly ConcurrentDictionary<string, DomainModels.Payment> _payments = new();

        public override Task<PaymentAuthorizationResponse> AuthorizePayment(
            PaymentAuthorizationRequest request,  // This now clearly refers to the Proto version
            ServerCallContext context)
        {
            var payment = new DomainModels.Payment
            {
                PaymentId = Guid.NewGuid().ToString(),
                ClaimId = request.ClaimId,
                ClaimantName = request.ClaimantName,
                WeeklyBenefitAmount = (decimal)request.WeeklyBenefitAmount,
                TotalAuthorized = (decimal)request.MaxBenefitAmount,
                Status = "AUTHORIZED",
                CreatedAt = DateTime.UtcNow,
                PaymentMethod = "Direct Deposit"
            };

            _payments.TryAdd(payment.PaymentId, payment);

            // Simulate processing
            Task.Run(async () =>
            {
                await Task.Delay(5000);
                payment.Status = "PROCESSED";
                payment.ProcessedAt = DateTime.UtcNow;
            });

            return Task.FromResult(new PaymentAuthorizationResponse
            {
                Success = true,
                PaymentId = payment.PaymentId,
                Status = payment.Status,
                Message = "Payment authorized successfully"
            });
        }

        // ... rest of the methods remain the same, just use DomainModels.Payment

        private PaymentResponse MapToProto(DomainModels.Payment payment)
        {
            return new PaymentResponse
            {
                PaymentId = payment.PaymentId,
                ClaimId = payment.ClaimId,
                ClaimantName = payment.ClaimantName,
                WeeklyBenefitAmount = (double)payment.WeeklyBenefitAmount,
                TotalAuthorized = (double)payment.TotalAuthorized,
                Status = payment.Status,
                CreatedAt = payment.CreatedAt.ToString("O"),
                ProcessedAt = payment.ProcessedAt?.ToString("O") ?? "",
                PaymentMethod = payment.PaymentMethod
            };
        }
    }
}
