using Microsoft.AspNetCore.Mvc;

namespace EmployerServices.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new
            {
                status = "HEALTHY",
                timestamp = DateTime.UtcNow,
                service = "employer-services"
            });
        }
    }
}