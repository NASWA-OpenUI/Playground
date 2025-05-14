using Microsoft.AspNetCore.Mvc;
using BenefitsAdmin.Models;
using BenefitsAdmin.Services;

namespace BenefitsAdmin.Controllers
{
    [ApiController]
    [Route("api")]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;

        public PaymentController(PaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("authorize-payment")]
        public IActionResult AuthorizePayment([FromBody] PaymentAuthorizationRequest request)
        {
            try
            {
                var payment = _paymentService.AuthorizePayment(request);
                return Ok(new
                {
                    success = true,
                    paymentId = payment.PaymentId,
                    status = payment.Status,
                    message = "Payment authorized successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("payment/{paymentId}")]
        public IActionResult GetPayment(string paymentId)
        {
            var payment = _paymentService.GetPayment(paymentId);
            if (payment == null)
                return NotFound(new { error = "Payment not found" });

            return Ok(payment);
        }

        [HttpGet("payments/claim/{claimId}")]
        public IActionResult GetPaymentsByClaimId(string claimId)
        {
            var payments = _paymentService.GetPaymentsByClaimId(claimId);
            return Ok(payments);
        }

        [HttpGet("payments")]
        public IActionResult GetAllPayments()
        {
            var payments = _paymentService.GetAllPayments();
            return Ok(payments);
        }
    }
}
