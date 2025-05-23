using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EmployerServices.Models
{
    public class ImportedClaim
    {
        [Key]
        public long Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string ClaimReferenceId { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string ClaimantName { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string ClaimantEmail { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string ClaimantPhone { get; set; } = string.Empty;
        
        [StringLength(200)]
        public string EmployerName { get; set; } = string.Empty;
        
        [StringLength(20)]
        public string EmployerEin { get; set; } = string.Empty;
        
        public DateTime ClaimedStartDate { get; set; }
        public DateTime ClaimedEndDate { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal ClaimedWages { get; set; }
        
        [StringLength(100)]
        public string SeparationReason { get; set; } = string.Empty;
        
        public string? SeparationDetails { get; set; }
        
        [StringLength(50)]
        public string Status { get; set; } = string.Empty;
        
        public DateTime ImportedAt { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; }
    }
}