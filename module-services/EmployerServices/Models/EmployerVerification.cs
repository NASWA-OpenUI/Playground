using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EmployerServices.Models
{
    public class EmployerVerification
    {
        [Key]
        public long Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string ClaimReferenceId { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string? EmployerId { get; set; }
        
        public DateTime? VerifiedStartDate { get; set; }
        public DateTime? VerifiedEndDate { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal? VerifiedWages { get; set; }
        
        public bool? SeparationConfirmed { get; set; }
        
        public string? VerificationNotes { get; set; }
        
        [StringLength(100)]
        public string? VerifiedBy { get; set; }
        
        public DateTime VerificationTimestamp { get; set; } = DateTime.UtcNow;
        
        public VerificationStatus Status { get; set; } = VerificationStatus.PENDING;
    }
    
    public enum VerificationStatus
    {
        PENDING,
        VERIFIED,
        DISPUTED
    }
}