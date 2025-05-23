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
        	    serviceId = _config["CamelGateway:ServiceName"],  // ← Fixed: use serviceId
	            name = _config["CamelGateway:ServiceName"],       // ← Added: name field
        	    technology = "DOTNET",                            // ← Added: technology
	            protocol = "HTTP",                                // ← Added: protocol
        	    endpoint = $"http://employer-services:{_config["CamelGateway:ServicePort"]}", // ← Fixed: use container name + endpoint
	            healthEndpoint = "/api/health"                    // ← Kept: healthEndpoint
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
                    serviceName = _config["CamelGateway:ServiceName"],
                    timestamp = DateTime.UtcNow,
                    status = "HEALTHY"
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
                var response = await _httpClient.GetAsync(
                    $"{_config["CamelGateway:BaseUrl"]}/api/claims?status=AWAITING_EMPLOYER");
                
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    return JsonConvert.DeserializeObject<List<ClaimDto>>(json) ?? new List<ClaimDto>();
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
                var response = await _httpClient.GetAsync(
                    $"{_config["CamelGateway:BaseUrl"]}/api/claims/{claimId}");
                
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    return JsonConvert.DeserializeObject<ClaimDto>(json);
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
                var json = JsonConvert.SerializeObject(verification);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                
                var response = await _httpClient.PostAsync(
                    $"{_config["CamelGateway:BaseUrl"]}/api/claims/{claimId}/verify", 
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