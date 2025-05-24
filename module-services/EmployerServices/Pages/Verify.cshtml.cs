using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using EmployerServices.Data;
using EmployerServices.Services;
using EmployerServices.Models;

namespace EmployerServices.Pages
{
    public class VerifyModel : PageModel
    {
        private readonly ICamelGatewayService _camelService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<VerifyModel> _logger;

        public VerifyModel(
            ICamelGatewayService camelService,
            ApplicationDbContext context,
            ILogger<VerifyModel> logger)
        {
            _camelService = camelService;
            _context = context;
            _logger = logger;
        }

        [BindProperty(SupportsGet = true)]
        public string ClaimId { get; set; } = string.Empty;

        public ClaimDto? Claim { get; set; }

        [BindProperty]
        public DateTime? VerifiedStartDate { get; set; }

        [BindProperty]
        public DateTime? VerifiedEndDate { get; set; }

        [BindProperty]
        public decimal VerifiedWages { get; set; }

        [BindProperty]
        public bool? SeparationConfirmed { get; set; }

        [BindProperty]
        public string? VerificationNotes { get; set; }

        [BindProperty]
        public string VerifiedBy { get; set; } = string.Empty;

        public string? ErrorMessage { get; set; }
        public string? SuccessMessage { get; set; }

        public async Task<IActionResult> OnGetAsync()
        {
            try
            {
                // Get claim details from Camel Gateway
                Claim = await _camelService.GetClaimByIdAsync(ClaimId);
                
                if (Claim == null)
                {
                    ErrorMessage = "Claim not found or no longer available for verification.";
                    return Page();
                }

                // Pre-populate form with claimed values as starting point
                VerifiedStartDate = Claim.ClaimedStartDate;
                VerifiedEndDate = Claim.ClaimedEndDate;
                VerifiedWages = Claim.ClaimedWages;
                SeparationConfirmed = true; // Default to confirmed

                _logger.LogInformation("Loaded claim {ClaimId} for verification", ClaimId);
                return Page();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading claim {ClaimId} for verification", ClaimId);
                ErrorMessage = "An error occurred while loading the claim. Please try again.";
                return Page();
            }
        }

        public async Task<IActionResult> OnPostAsync()
        {
            try
            {
                // Reload claim data for display
                Claim = await _camelService.GetClaimByIdAsync(ClaimId);
                if (Claim == null)
                {
                    ErrorMessage = "Claim not found or no longer available for verification.";
                    return Page();
                }

                // Validate the form
                if (!ModelState.IsValid)
                {
                    ErrorMessage = "Please correct the errors below and try again.";
                    return Page();
                }

                // Additional validation
                if (!VerifiedStartDate.HasValue || !VerifiedEndDate.HasValue || !SeparationConfirmed.HasValue)
                {
                    ErrorMessage = "All verification fields are required.";
                    return Page();
                }

                if (VerifiedStartDate.Value >= VerifiedEndDate.Value)
                {
                    ErrorMessage = "End date must be after start date.";
                    return Page();
                }

                if (VerifiedWages < 0)
                {
                    ErrorMessage = "Wages cannot be negative.";
                    return Page();
                }

                if (string.IsNullOrWhiteSpace(VerifiedBy))
                {
                    ErrorMessage = "Please provide your name or employee ID.";
                    return Page();
                }

                // Create verification record for local database
                var verification = new EmployerVerification
                {
                    ClaimReferenceId = ClaimId,
                    EmployerId = Claim.EmployerEin,
                    VerifiedStartDate = VerifiedStartDate.Value,
                    VerifiedEndDate = VerifiedEndDate.Value,
                    VerifiedWages = VerifiedWages,
                    SeparationConfirmed = SeparationConfirmed.Value,
                    VerificationNotes = VerificationNotes,
                    VerifiedBy = VerifiedBy.Trim(),
                    Status = VerificationStatus.VERIFIED,
                    VerificationTimestamp = DateTime.UtcNow
                };

                // Save to local database
                _context.EmployerVerifications.Add(verification);
                await _context.SaveChangesAsync();

                // Create verification request for Camel Gateway
                var verificationRequest = new VerificationRequest
                {
                    VerifiedStartDate = VerifiedStartDate.Value,
                    VerifiedEndDate = VerifiedEndDate.Value,
                    VerifiedWages = VerifiedWages,
                    SeparationConfirmed = SeparationConfirmed.Value,
                    VerificationNotes = VerificationNotes,
                    VerifiedBy = VerifiedBy.Trim()
                };

                // Submit to Camel Gateway
                var success = await _camelService.SubmitVerificationAsync(ClaimId, verificationRequest);

                if (success)
                {
                    _logger.LogInformation("Successfully verified claim {ClaimId} by {VerifiedBy}", ClaimId, VerifiedBy);
                    
                    // Redirect to dashboard with success message
                    TempData["SuccessMessage"] = $"Claim {ClaimId} has been successfully verified and submitted to the system.";
                    return RedirectToPage("/Dashboard");
                }
                else
                {
                    _logger.LogError("Failed to submit verification for claim {ClaimId} to Camel Gateway", ClaimId);
                    ErrorMessage = "Verification was saved locally but failed to submit to the main system. Please contact support.";
                    return Page();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting verification for claim {ClaimId}", ClaimId);
                ErrorMessage = "An error occurred while submitting the verification. Please try again.";
                return Page();
            }
        }
    }
}