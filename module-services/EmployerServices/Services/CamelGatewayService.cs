using System.Text;
using Newtonsoft.Json;
using EmployerServices.Models;

namespace EmployerServices.Services
{
    public class CamelGatewayService : ICamelGatewayService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<CamelGatewayService> _logger;
        
        public CamelGatewayService(HttpClient httpClient, IConfiguration config, ILogger<CamelGatewayService> logger)
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
        }
        
        public async Task<bool> RegisterServiceAsync()
        {
            try
            {
                var registration = new
                {
                    serviceId = _config["CamelGateway:ServiceName"],
                    name = _config["CamelGateway:ServiceName"],
                    technology = "DOTNET",
                    protocol = "HTTP",
                    endpoint = $"http://employer-services:{_config["CamelGateway:ServicePort"]}",
                    healthEndpoint = "/api/health"
                };
        
                var json = JsonConvert.SerializeObject(registration);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
        
                var response = await _httpClient.PostAsync(
                    $"{_config["CamelGateway:BaseUrl"]}/api/services/register", 
                    content);
        
                _logger.LogInformation($"Service registration result: {response.StatusCode}");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to register with Camel Gateway");
                return false;
            }
        }
        
        public async Task SendHeartbeatAsync()
        {
            try
            {
                var heartbeat = new
                {
                    serviceId = _config["CamelGateway:ServiceName"],
                    timestamp = DateTime.UtcNow,
                    status = "UP"
                };
                
                var json = JsonConvert.SerializeObject(heartbeat);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                await _httpClient.PostAsync(
                    $"{_config["CamelGateway:BaseUrl"]}/api/services/heartbeat", 
                    content);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send heartbeat");
            }
        }
        
        public async Task<List<ClaimDto>> GetPendingClaimsAsync()
        {
            try
            {
                // 🔥 FIXED: Use the working /api/claims endpoint and filter client-side
                var response = await _httpClient.GetAsync(
                    $"{_config["CamelGateway:BaseUrl"]}/api/claims");
                
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var allClaims = JsonConvert.DeserializeObject<List<dynamic>>(json) ?? new List<dynamic>();
                    
                    // Filter for claims with status "AWAITING_EMPLOYER"
                    var pendingClaims = allClaims.Where(c => c.statusCode?.ToString() == "AWAITING_EMPLOYER").ToList();
                    
                    // 🔥 Transform Camel Gateway format to our ClaimDto format
                    return pendingClaims.Select(c => new ClaimDto
                    {
                        ClaimReferenceId = c.claimReferenceId?.ToString() ?? "",
                        ClaimantName = $"{c.firstName} {c.lastName}",
                        ClaimantEmail = c.emailAddress?.ToString() ?? "",
                        ClaimantPhone = c.phoneNumber?.ToString() ?? "",
                        EmployerName = c.employerName?.ToString() ?? "",
                        EmployerEin = c.employerId?.ToString() ?? "",
                        ClaimedStartDate = DateTime.TryParse(c.employmentStartDate?.ToString(), out DateTime startDate) ? startDate : DateTime.MinValue,
                        ClaimedEndDate = DateTime.TryParse(c.employmentEndDate?.ToString(), out DateTime endDate) ? endDate : DateTime.MinValue,
                        ClaimedWages = decimal.TryParse(c.totalAnnualEarnings?.ToString(), out decimal wages) ? wages : 0,
                        SeparationReason = c.separationReasonCode?.ToString() ?? "",
                        SeparationDetails = c.separationExplanation?.ToString(),
                        Status = c.statusCode?.ToString() ?? "",
                        CreatedAt = DateTime.TryParse(c.receivedTimestamp?.ToString(), out DateTime created) ? created : DateTime.MinValue
                    }).ToList();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get pending claims");
            }
            
            return new List<ClaimDto>();
        }
        
        public async Task<ClaimDto?> GetClaimByIdAsync(string claimId)
        {
            try
            {
                // 🔥 ALSO FIXED: Use the working /api/claims endpoint and find by ID
                var response = await _httpClient.GetAsync(
                    $"{_config["CamelGateway:BaseUrl"]}/api/claims");
                
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var allClaims = JsonConvert.DeserializeObject<List<dynamic>>(json) ?? new List<dynamic>();
                    
                    // Find the specific claim by ID
                    var c = allClaims.FirstOrDefault(claim => claim.claimReferenceId?.ToString() == claimId);
                    
                    if (c != null)
                    {
                        // 🔥 Transform Camel Gateway format to our ClaimDto format
                        return new ClaimDto
                        {
                            ClaimReferenceId = c.claimReferenceId?.ToString() ?? "",
                            ClaimantName = $"{c.firstName} {c.lastName}",
                            ClaimantEmail = c.emailAddress?.ToString() ?? "",
                            ClaimantPhone = c.phoneNumber?.ToString() ?? "",
                            EmployerName = c.employerName?.ToString() ?? "",
                            EmployerEin = c.employerId?.ToString() ?? "",
                            ClaimedStartDate = DateTime.TryParse(c.employmentStartDate?.ToString(), out DateTime startDate) ? startDate : DateTime.MinValue,
                            ClaimedEndDate = DateTime.TryParse(c.employmentEndDate?.ToString(), out DateTime endDate) ? endDate : DateTime.MinValue,
                            ClaimedWages = decimal.TryParse(c.totalAnnualEarnings?.ToString(), out decimal wages) ? wages : 0,
                            SeparationReason = c.separationReasonCode?.ToString() ?? "",
                            SeparationDetails = c.separationExplanation?.ToString(),
                            Status = c.statusCode?.ToString() ?? "",
                            CreatedAt = DateTime.TryParse(c.receivedTimestamp?.ToString(), out DateTime created) ? created : DateTime.MinValue
                        };
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to get claim {claimId}");
            }
            
            return null;
        }
        
        public async Task<bool> SubmitVerificationAsync(string claimId, VerificationRequest verification)
        {
            try
            {
                // 🔥 Update the claim status in Camel Gateway after verification
                var updateData = new
                {
                    statusCode = "AWAITING_TAX_CALC",
                    statusDisplayName = "Awaiting Tax Calculation",
                    updatedBy = verification.VerifiedBy,
                    notes = $"Employer verification completed. Verified wages: ${verification.VerifiedWages:F2}. {verification.VerificationNotes}"
                };
                
                var json = JsonConvert.SerializeObject(updateData);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PutAsync(
                    $"{_config["CamelGateway:BaseUrl"]}/api/claims/{claimId}/status", 
                    content);
                
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to submit verification for claim {claimId}");
                return false;
            }
        }
    }
}