using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using EmployerServices.Data;
using EmployerServices.Models;
using EmployerServices.Services;
using EmployerServices.Hubs;

namespace EmployerServices.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClaimsController : ControllerBase
    {
        private readonly ICamelGatewayService _camelService;
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ClaimHub> _hubContext;
        private readonly ILogger<ClaimsController> _logger;
        
        public ClaimsController(
            ICamelGatewayService camelService,
            ApplicationDbContext context,
            IHubContext<ClaimHub> hubContext,
            ILogger<ClaimsController> logger)
        {
            _camelService = camelService;
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }
        
        [HttpGet("pending")]
        public async Task<ActionResult<List<ClaimDto>>> GetPendingClaims()
        {
            try
            {
                var claims = await _camelService.GetPendingClaimsAsync();
                return Ok(claims);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get pending claims");
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpGet("{claimId}")]
        public async Task<ActionResult<ClaimDto>> GetClaim(string claimId)
        {
            try
            {
                var claim = await _camelService.GetClaimByIdAsync(claimId);
                if (claim == null)
                    return NotFound();
                    
                return Ok(claim);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get claim {claimId}");
                return StatusCode(500, "Internal server error");
            }
        }
        
        [HttpPost("{claimId}/verify")]
        public async Task<IActionResult> VerifyClaim(string claimId, [FromBody] VerificationRequest request)
        {
            try
            {
                // Save verification to local database
                var verification = new EmployerVerification
                {
                    ClaimReferenceId = claimId,
                    VerifiedStartDate = request.VerifiedStartDate,
                    VerifiedEndDate = request.VerifiedEndDate,
                    VerifiedWages = request.VerifiedWages,
                    SeparationConfirmed = request.SeparationConfirmed,
                    VerificationNotes = request.VerificationNotes,
                    VerifiedBy = request.VerifiedBy,
                    Status = VerificationStatus.VERIFIED
                };
                
                _context.EmployerVerifications.Add(verification);
                await _context.SaveChangesAsync();
                
                // Submit to Camel Gateway
                var success = await _camelService.SubmitVerificationAsync(claimId, request);
                
                if (success)
                {
                    // Notify connected clients
                    await _hubContext.Clients.All.SendAsync("ClaimVerified", claimId);
                    return Ok(new { message = "Verification submitted successfully" });
                }
                else
                {
                    return BadRequest(new { message = "Failed to submit verification to gateway" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to verify claim {claimId}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}