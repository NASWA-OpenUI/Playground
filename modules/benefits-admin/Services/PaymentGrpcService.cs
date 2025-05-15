using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Threading.Tasks;
using Grpc.Core;
using BenefitsAdmin.Protos;
using BenefitsAdmin.Models;

namespace BenefitsAdmin.Services
{
    public class PaymentGrpcService : PaymentService.PaymentServiceBase
    {
        private readonly ConcurrentDictionary<string, Payment> _payments = new();

        public override Task<PaymentAuthorizationResponse> AuthorizePayment(
            PaymentAuthorizationRequest request, 
            ServerCallContext context)
        {
            var payment = new Payment
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

        public override Task<PaymentResponse> GetPayment(
            GetPaymentRequest request, 
            ServerCallContext context)
        {
            if (_payments.TryGetValue(request.PaymentId, out var payment))
            {
                return Task.FromResult(MapToProto(payment));
            }

            throw new RpcException(new Status(StatusCode.NotFound, "Payment not found"));
        }

        public override Task<PaymentListResponse> GetPaymentsByClaimId(
            GetPaymentsByClaimIdRequest request, 
            ServerCallContext context)
        {
            var payments = _payments.Values
                .Where(p => p.ClaimId == request.ClaimId)
                .Select(MapToProto)
                .ToList();

            return Task.FromResult(new PaymentListResponse { Payments = { payments } });
        }

        public override Task<PaymentListResponse> GetAllPayments(
            GetAllPaymentsRequest request, 
            ServerCallContext context)
        {
            var payments = _payments.Values.Select(MapToProto).ToList();
            return Task.FromResult(new PaymentListResponse { Payments = { payments } });
        }

        private PaymentResponse MapToProto(Payment payment)
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
