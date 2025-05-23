namespace EmployerServices.Services
{
    public interface IClaimImportService
    {
        Task<bool> ImportClaimAsync(string claimReferenceId);
        Task<bool> ClaimExistsAsync(string claimReferenceId);
        Task<Models.ClaimDto?> GetImportedClaimAsync(string claimReferenceId);
    }
}