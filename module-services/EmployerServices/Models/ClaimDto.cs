namespace EmployerServices.Models
{
    public class ClaimDto
    {
        public string ClaimReferenceId { get; set; } = string.Empty;
        public string ClaimantName { get; set; } = string.Empty;
        public string ClaimantEmail { get; set; } = string.Empty;
        public string ClaimantPhone { get; set; } = string.Empty;
        public string EmployerName { get; set; } = string.Empty;
        public string EmployerEin { get; set; } = string.Empty;
        public DateTime ClaimedStartDate { get; set; }
        public DateTime ClaimedEndDate { get; set; }
        public decimal ClaimedWages { get; set; }
        public string SeparationReason { get; set; } = string.Empty;
        public string? SeparationDetails { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
    
    public class VerificationRequest
    {
        public DateTime VerifiedStartDate { get; set; }
        public DateTime VerifiedEndDate { get; set; }
        public decimal VerifiedWages { get; set; }
        public bool SeparationConfirmed { get; set; }
        public string? VerificationNotes { get; set; }
        public string VerifiedBy { get; set; } = string.Empty;
    }
}