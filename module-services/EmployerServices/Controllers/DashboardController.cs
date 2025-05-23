using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EmployerServices.Data;
using EmployerServices.Services;

namespace EmployerServices.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ICamelGatewayService _camelService;
        private readonly ApplicationDbContext _context;
        
        public DashboardController(ICamelGatewayService camelService, ApplicationDbContext context)
        {
            _camelService = camelService;
            _context = context;
        }
        
        [HttpGet]
        public async Task<IActionResult> GetDashboardData()
        {
            try
            {
                var pendingClaims = await _camelService.GetPendingClaimsAsync();
                var totalVerifications = await _context.EmployerVerifications.CountAsync();
                var todayVerifications = await _context.EmployerVerifications
                    .Where(v => v.VerificationTimestamp.Date == DateTime.Today)
                    .CountAsync();
                
                return Ok(new
                {
                    pendingClaimsCount = pendingClaims.Count,
                    totalVerifications,
                    todayVerifications,
                    pendingClaims
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to load dashboard data" });
            }
        }
    }
}