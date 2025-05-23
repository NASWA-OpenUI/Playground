using EmployerServices.Models;

namespace EmployerServices.Services
{
    public interface ICamelGatewayService
    {
        Task<bool> RegisterServiceAsync();
        Task SendHeartbeatAsync();
        Task<List<ClaimDto>> GetPendingClaimsAsync();
        Task<ClaimDto?> GetClaimByIdAsync(string claimId);
        Task<bool> SubmitVerificationAsync(string claimId, VerificationRequest verification);
    }
}