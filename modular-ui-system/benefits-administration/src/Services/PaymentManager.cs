namespace BenefitsAdmin.Services;

/// <summary>
/// Payment record
/// </summary>
public class Payment
{
    public string PaymentId { get; set; } = string.Empty;
    public string ClaimId { get; set; } = string.Empty;
    public double Amount { get; set; }
    public string Date { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public string PaymentType { get; set; } = string.Empty;
}

/// <summary>
/// Manages payments for benefit claims
/// </summary>
public class PaymentManager
{
    private readonly List<Payment> _payments = new();
    private int _paymentIdCounter = 1000;
    
    private readonly ILogger<PaymentManager> _logger;

    public PaymentManager(ILogger<PaymentManager> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Creates a new payment for a claim
    /// </summary>
    /// <param name="claimId">Claim ID</param>
    /// <param name="amount">Payment amount</param>
    /// <param name="paymentType">Type of payment (weekly, adjustment, etc.)</param>
    /// <returns>Created payment</returns>
    public Payment CreatePayment(string claimId, double amount, string paymentType = "weekly")
    {
        var paymentId = $"P{_paymentIdCounter++}";
        
        var payment = new Payment
        {
            PaymentId = paymentId,
            ClaimId = claimId,
            Amount = amount,
            Date = DateTime.UtcNow.ToString("o"),
            Status = "Processed",
            Method = "Direct Deposit",
            PaymentType = paymentType
        };
        
        _payments.Add(payment);
        
        _logger.LogInformation("Payment {PaymentId} created for claim {ClaimId} with amount {Amount}", 
            paymentId, claimId, amount);
        
        return payment;
    }

    /// <summary>
    /// Gets payment history for a claim
    /// </summary>
    /// <param name="claimId">Claim ID</param>
    /// <returns>List of payments for the claim</returns>
    public List<Payment> GetPaymentHistory(string claimId)
    {
        return _payments
            .Where(p => p.ClaimId == claimId)
            .OrderByDescending(p => p.Date)
            .ToList();
    }

    /// <summary>
    /// Gets all payments
    /// </summary>
    /// <returns>List of all payments</returns>
    public List<Payment> GetAllPayments()
    {
        return _payments
            .OrderByDescending(p => p.Date)
            .ToList();
    }
}