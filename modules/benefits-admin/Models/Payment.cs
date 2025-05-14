using System;

namespace BenefitsAdmin.Models
{
    public class Payment
    {
        public string PaymentId { get; set; }
        public string ClaimId { get; set; }
        public string ClaimantName { get; set; }
        public decimal WeeklyBenefitAmount { get; set; }
        public decimal TotalAuthorized { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string PaymentMethod { get; set; }
    }

    public class PaymentAuthorizationRequest
    {
        public string ClaimId { get; set; }
        public string ClaimantName { get; set; }
        public decimal WeeklyBenefitAmount { get; set; }
        public decimal MaxBenefitAmount { get; set; }
    }
}
