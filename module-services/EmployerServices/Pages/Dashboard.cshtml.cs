using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using EmployerServices.Data;
using EmployerServices.Services;
using EmployerServices.Models;

namespace EmployerServices.Pages
{
    public class DashboardModel : PageModel
    {
        private readonly ICamelGatewayService _camelService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DashboardModel> _logger;

        public DashboardModel(
            ICamelGatewayService camelService,
            ApplicationDbContext context,
            ILogger<DashboardModel> logger)
        {
            _camelService = camelService;
            _context = context;
            _logger = logger;
        }

        public List<ClaimDto> PendingClaims { get; set; } = new();
        public int PendingClaimsCount { get; set; }
        public int TotalVerifications { get; set; }
        public int TodayVerifications { get; set; }
        public string? SuccessMessage { get; set; }

        public async Task OnGetAsync()
        {
            try
            {
                // Check for success message from TempData
                if (TempData.ContainsKey("SuccessMessage"))
                {
                    SuccessMessage = TempData["SuccessMessage"]?.ToString();
                }

                // Get pending claims from Camel Gateway
                PendingClaims = await _camelService.GetPendingClaimsAsync();
                PendingClaimsCount = PendingClaims.Count;

                // Get verification stats from local database
                TotalVerifications = await _context.EmployerVerifications.CountAsync();
                TodayVerifications = await _context.EmployerVerifications
                    .Where(v => v.VerificationTimestamp.Date == DateTime.Today)
                    .CountAsync();

                _logger.LogInformation("Dashboard loaded: {PendingCount} pending claims, {Total} total verifications", 
                    PendingClaimsCount, TotalVerifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading dashboard data");
                // Set defaults in case of error
                PendingClaims = new List<ClaimDto>();
                PendingClaimsCount = 0;
                TotalVerifications = 0;
                TodayVerifications = 0;
            }
        }
    }
}