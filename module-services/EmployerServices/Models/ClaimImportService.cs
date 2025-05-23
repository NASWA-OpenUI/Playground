using Microsoft.EntityFrameworkCore;
using EmployerServices.Data;
using EmployerServices.Models;
using System.Text.Json;

namespace EmployerServices.Services
{
    public class ClaimImportService : IClaimImportService
    {
        private readonly ICamelGatewayService _camelService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ClaimImportService> _logger;
        
        public ClaimImportService(
            ICamelGatewayService camelService,
            ApplicationDbContext context,
            ILogger<ClaimImportService> logger)
        {
            _camelService = camelService;
            _context = context;
            _logger = logger;
        }
        
        public async Task<bool> ImportClaimAsync(string claimReferenceId)
        {
            try
            {
                _logger.LogInformation("Attempting to import claim: {ClaimReferenceId}", claimReferenceId);
                
                // Check if claim already exists in our database
                if (await ClaimExistsAsync(claimReferenceId))
                {
                    _logger.LogInformation("Claim {ClaimReferenceId} already exists, skipping import", claimReferenceId);
                    return true;
                }
                
                // Fetch claim details from Camel Gateway
                var claimData = await _camelService.GetClaimByIdAsync(claimReferenceId);
                if (claimData == null)
                {
                    _logger.LogError("Could not retrieve claim {ClaimReferenceId} from Camel Gateway", claimReferenceId);
                    return false;
                }
                
                // Create a record in our local database to track this claim
                var importedClaim = new ImportedClaim
                {
                    ClaimReferenceId = claimReferenceId,
                    ClaimantName = claimData.ClaimantName,
                    ClaimantEmail = claimData.ClaimantEmail,
                    ClaimantPhone = claimData.ClaimantPhone,
                    EmployerName = claimData.EmployerName,
                    EmployerEin = claimData.EmployerEin,
                    ClaimedStartDate = claimData.ClaimedStartDate,
                    ClaimedEndDate = claimData.ClaimedEndDate,
                    ClaimedWages = claimData.ClaimedWages,
                    SeparationReason = claimData.SeparationReason,
                    SeparationDetails = claimData.SeparationDetails,
                    Status = claimData.Status,
                    ImportedAt = DateTime.UtcNow,
                    CreatedAt = claimData.CreatedAt
                };
                
                _context.ImportedClaims.Add(importedClaim);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Successfully imported claim {ClaimReferenceId}", claimReferenceId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to import claim {ClaimReferenceId}", claimReferenceId);
                return false;
            }
        }
        
        public async Task<bool> ClaimExistsAsync(string claimReferenceId)
        {
            return await _context.ImportedClaims
                .AnyAsync(c => c.ClaimReferenceId == claimReferenceId);
        }
        
        public async Task<ClaimDto?> GetImportedClaimAsync(string claimReferenceId)
        {
            var importedClaim = await _context.ImportedClaims
                .FirstOrDefaultAsync(c => c.ClaimReferenceId == claimReferenceId);
                
            if (importedClaim == null)
            {
                return null;
            }
            
            return new ClaimDto
            {
                ClaimReferenceId = importedClaim.ClaimReferenceId,
                ClaimantName = importedClaim.ClaimantName,
                ClaimantEmail = importedClaim.ClaimantEmail,
                ClaimantPhone = importedClaim.ClaimantPhone,
                EmployerName = importedClaim.EmployerName,
                EmployerEin = importedClaim.EmployerEin,
                ClaimedStartDate = importedClaim.ClaimedStartDate,
                ClaimedEndDate = importedClaim.ClaimedEndDate,
                ClaimedWages = importedClaim.ClaimedWages,
                SeparationReason = importedClaim.SeparationReason,
                SeparationDetails = importedClaim.SeparationDetails,
                Status = importedClaim.Status,
                CreatedAt = importedClaim.CreatedAt
            };
        }
    }
}