package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
)

type PaymentService struct {
	redisClient      *redis.Client
	gatewayURL       string
	serviceName      string
	servicePort      string
	isRegistered     bool
	httpClient       *http.Client
	maxWeeklyBenefit float64
	replacementRate  float64
	benefitWeeks     int
}

type ClaimData struct {
	ClaimReferenceID      string  `json:"claimReferenceId"`
	FirstName            string  `json:"firstName"`
	LastName             string  `json:"lastName"`
	EmailAddress         string  `json:"emailAddress"`
	PhoneNumber          string  `json:"phoneNumber"`
	EmployerName         string  `json:"employerName"`
	EmployerID           string  `json:"employerId"`
	EmploymentStartDate  string  `json:"employmentStartDate"`
	EmploymentEndDate    string  `json:"employmentEndDate"`
	TotalAnnualEarnings  float64 `json:"totalAnnualEarnings"`
	SeparationReasonCode string  `json:"separationReasonCode"`
	SeparationExplanation string `json:"separationExplanation"`
	StatusCode           string  `json:"statusCode"`
	ReceivedTimestamp    string  `json:"receivedTimestamp"`
	StateTaxAmount       float64 `json:"stateTaxAmount"`
	FederalTaxAmount     float64 `json:"federalTaxAmount"`
	TotalTaxAmount       float64 `json:"totalTaxAmount"`
}

type PaymentCalculation struct {
	ClaimID              string    `json:"claimId"`
	ClaimantName         string    `json:"claimantName"`
	AnnualWages          float64   `json:"annualWages"`
	HighestQuarter       float64   `json:"highestQuarter"`
	BaseWBA              float64   `json:"baseWBA"`
	WeeklyBenefitAmount  float64   `json:"weeklyBenefitAmount"`
	MaximumBenefit       float64   `json:"maximumBenefit"`
	WeeklyTaxWithholding float64   `json:"weeklyTaxWithholding"`
	FirstPaymentAmount   float64   `json:"firstPaymentAmount"`
	ProcessedAt          time.Time `json:"processedAt"`
	Status               string    `json:"status"`
}

// HTTP Request/Response types
type ServiceRegistrationRequest struct {
	ServiceID      string `json:"serviceId"`
	Name          string `json:"name"`
	Technology    string `json:"technology"`
	Protocol      string `json:"protocol"`
	Endpoint      string `json:"endpoint"`
	HealthEndpoint string `json:"healthEndpoint"`
}

type HeartbeatRequest struct {
	ServiceID string `json:"serviceId"`
	Timestamp string `json:"timestamp"`
	Status    string `json:"status"`
}

type PaymentUpdateRequest struct {
	ClaimID             string  `json:"claimId"`
	Status              string  `json:"status"`
	WeeklyBenefitAmount float64 `json:"weeklyBenefitAmount"`
	MaximumBenefit      float64 `json:"maximumBenefit"`
	FirstPaymentAmount  float64 `json:"firstPaymentAmount"`
	UpdatedBy           string  `json:"updatedBy"`
	Notes               string  `json:"notes"`
}

type HTTPResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Claims  []ClaimData `json:"claims,omitempty"`
}

func NewPaymentService() *PaymentService {
	gatewayURL := getEnv("CAMEL_GATEWAY_URL", "http://camel-gateway:8080")
	serviceName := getEnv("SERVICE_NAME", "paymentservices")
	servicePort := getEnv("PORT", "6000")
	
	// Configuration for benefit calculations
	maxWeeklyBenefit, _ := strconv.ParseFloat(getEnv("MAX_WEEKLY_BENEFIT", "600.00"), 64)
	replacementRate, _ := strconv.ParseFloat(getEnv("REPLACEMENT_RATE", "0.60"), 64)
	benefitWeeks, _ := strconv.Atoi(getEnv("BENEFIT_WEEKS", "26"))

	// Initialize Redis client with better error handling
	redisAddr := getEnv("REDIS_URL", "localhost:6379")
	redisClient := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: getEnv("REDIS_PASSWORD", ""),
		DB:       0,
	})

	// HTTP client with timeout
	httpClient := &http.Client{
		Timeout: 10 * time.Second,
	}

	return &PaymentService{
		redisClient:      redisClient,
		gatewayURL:      gatewayURL,
		serviceName:     serviceName,
		servicePort:     servicePort,
		httpClient:      httpClient,
		maxWeeklyBenefit: maxWeeklyBenefit,
		replacementRate:  replacementRate,
		benefitWeeks:     benefitWeeks,
	}
}

func (ps *PaymentService) makeHTTPRequest(method, endpoint string, payload interface{}) (*HTTPResponse, error) {
	url := ps.gatewayURL + endpoint
	
	var body io.Reader
	if payload != nil {
		jsonData, err := json.Marshal(payload)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal payload: %v", err)
		}
		body = bytes.NewBuffer(jsonData)
		log.Printf("🔄 Making %s request to %s with payload: %s", method, url, string(jsonData))
	} else {
		log.Printf("🔄 Making %s request to %s", method, url)
	}

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	if payload != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := ps.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %v", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	log.Printf("📥 Response status: %d, body: %s", resp.StatusCode, string(respBody))

	// Handle different response formats
	var httpResp HTTPResponse
	
	// First try to unmarshal as HTTPResponse
	if err := json.Unmarshal(respBody, &httpResp); err != nil {
		// If that fails, check if it's a raw array (for claims endpoint)
		if endpoint == "/api/claims" || strings.Contains(endpoint, "claims") {
			var claims []ClaimData
			if arrayErr := json.Unmarshal(respBody, &claims); arrayErr == nil {
				// Successfully parsed as array, wrap it in HTTPResponse format
				httpResp = HTTPResponse{
					Success: true,
					Message: fmt.Sprintf("Found %d claims", len(claims)),
					Claims:  claims,
				}
				return &httpResp, nil
			}
		}
		return nil, fmt.Errorf("failed to unmarshal response: %v", err)
	}

	return &httpResp, nil
}

func (ps *PaymentService) registerWithGateway() error {
	request := ServiceRegistrationRequest{
		ServiceID:      ps.serviceName,
		Name:          "Payment Services",
		Technology:    "Go + Gin",
		Protocol:      "HTTP",
		Endpoint:      fmt.Sprintf("http://%s:%s", ps.serviceName, ps.servicePort),
		HealthEndpoint: fmt.Sprintf("http://%s:%s/health", ps.serviceName, ps.servicePort),
	}

	log.Printf("🔄 Registering with Camel Gateway...")
	
	// Try multiple possible registration endpoints
	endpoints := []string{
		"/api/services/register",
		"/api/register", 
		"/register",
		"/services/register",
	}
	
	var lastErr error
	for _, endpoint := range endpoints {
		response, err := ps.makeHTTPRequest("POST", endpoint, request)
		if err != nil {
			lastErr = err
			log.Printf("⚠️ Registration failed on %s: %v", endpoint, err)
			continue
		}
		
		if response.Success {
			ps.isRegistered = true
			log.Printf("✅ Successfully registered with gateway via %s: %s", endpoint, response.Message)
			return nil
		} else {
			log.Printf("⚠️ Registration rejected on %s: %s", endpoint, response.Message)
		}
	}
	
	log.Printf("⚠️ All registration endpoints failed, continuing without registration")
	return lastErr
}

func (ps *PaymentService) sendHeartbeat() error {
	// Allow heartbeat even if not registered (for demo purposes)
	request := HeartbeatRequest{
		ServiceID: ps.serviceName,
		Timestamp: time.Now().Format(time.RFC3339),
		Status:    "UP",
	}

	// Try multiple possible heartbeat endpoints
	endpoints := []string{
		"/api/services/heartbeat",
		"/api/heartbeat",
		"/heartbeat",
		"/services/heartbeat",
	}
	
	for _, endpoint := range endpoints {
		response, err := ps.makeHTTPRequest("POST", endpoint, request)
		if err != nil {
			continue // Try next endpoint
		}
		
		if response.Success {
			log.Printf("💓 Heartbeat sent successfully via %s", endpoint)
			return nil
		}
	}
	
	// Don't log heartbeat failures if we're not registered
	if ps.isRegistered {
		log.Printf("⚠️ All heartbeat endpoints failed")
	}
	return nil
}

func (ps *PaymentService) pollForClaims() ([]ClaimData, error) {
	// Try multiple possible claims endpoints
	endpoints := []string{
		"/api/claims?status=AWAITING_PAYMENT",
		"/api/claims?status=AWAITING_PAYMENT_PROCESSING",
		"/api/claims/status/AWAITING_PAYMENT",
		"/api/claims/status/AWAITING_PAYMENT_PROCESSING",
		"/claims?status=AWAITING_PAYMENT",
		"/api/claims", // Get all claims and filter
	}
	
	for _, endpoint := range endpoints {
		response, err := ps.makeHTTPRequest("GET", endpoint, nil)
		if err != nil {
			continue // Try next endpoint
		}
		
		if response.Success {
			// Filter claims by status if we got all claims
			var filteredClaims []ClaimData
			for _, claim := range response.Claims {
				if claim.StatusCode == "AWAITING_PAYMENT" || claim.StatusCode == "AWAITING_PAYMENT_PROCESSING" {
					filteredClaims = append(filteredClaims, claim)
				}
			}
			
			if len(filteredClaims) > 0 {
				log.Printf("📋 Found %d claims awaiting payment processing via %s", len(filteredClaims), endpoint)
				return filteredClaims, nil
			}
		}
	}
	
	log.Printf("📋 No claims found awaiting payment processing")
	return []ClaimData{}, nil // Return empty slice instead of mock data
}

func (ps *PaymentService) updateClaimPayment(payment PaymentCalculation) error {
	request := PaymentUpdateRequest{
		ClaimID:             payment.ClaimID,
		Status:              "PAYMENT_PROCESSED",
		WeeklyBenefitAmount: payment.WeeklyBenefitAmount,
		MaximumBenefit:      payment.MaximumBenefit,
		FirstPaymentAmount:  payment.FirstPaymentAmount,
		UpdatedBy:           "paymentservices",
		Notes:               fmt.Sprintf("Payment processed. WBA: $%.2f, Max Benefit: $%.2f, First Payment: $%.2f", 
			payment.WeeklyBenefitAmount, payment.MaximumBenefit, payment.FirstPaymentAmount),
	}

	log.Printf("🔄 Sending payment update to Camel Gateway...")
	
	// Try multiple possible update endpoints
	endpoints := []string{
		"/api/claims/update",
		"/api/claims/" + payment.ClaimID + "/status",
		"/claims/update",
		"/api/payment/update",
	}
	
	for _, endpoint := range endpoints {
		response, err := ps.makeHTTPRequest("POST", endpoint, request)
		if err != nil {
			continue // Try next endpoint
		}
		
		if response.Success {
			log.Printf("✅ Payment update successful via %s: %s", endpoint, response.Message)
			log.Printf("✅ Payment processed for claim %s: WBA=$%.2f, Max Benefit=$%.2f", 
				payment.ClaimID, payment.WeeklyBenefitAmount, payment.MaximumBenefit)
			return nil
		}
	}
	
	log.Printf("⚠️ Payment update failed on all endpoints for claim %s", payment.ClaimID)
	return fmt.Errorf("payment update failed on all endpoints")
}

func (ps *PaymentService) calculateBenefits(claim ClaimData) PaymentCalculation {
	// Calculate Weekly Benefit Amount using DOL formula
	highestQuarter := claim.TotalAnnualEarnings / 4
	baseWBA := (highestQuarter / 26) * ps.replacementRate
	weeklyBenefitAmount := math.Min(baseWBA, ps.maxWeeklyBenefit)
	
	// Calculate Maximum Benefit (26 weeks)
	maximumBenefit := weeklyBenefitAmount * float64(ps.benefitWeeks)
	
	// Calculate weekly tax withholding (proportional to annual taxes)
	weeklyTaxWithholding := claim.TotalTaxAmount / 52
	
	// First payment amount (WBA minus tax withholding)
	firstPaymentAmount := weeklyBenefitAmount - weeklyTaxWithholding
	
	return PaymentCalculation{
		ClaimID:              claim.ClaimReferenceID,
		ClaimantName:         fmt.Sprintf("%s %s", claim.FirstName, claim.LastName),
		AnnualWages:          claim.TotalAnnualEarnings,
		HighestQuarter:       highestQuarter,
		BaseWBA:              baseWBA,
		WeeklyBenefitAmount:  math.Round(weeklyBenefitAmount*100) / 100,
		MaximumBenefit:       math.Round(maximumBenefit*100) / 100,
		WeeklyTaxWithholding: math.Round(weeklyTaxWithholding*100) / 100,
		FirstPaymentAmount:   math.Round(firstPaymentAmount*100) / 100,
		ProcessedAt:          time.Now(),
		Status:               "PENDING_CONFIRMATION",
	}
}

// Removed getMockClaims function - no longer needed

func (ps *PaymentService) storePayment(payment PaymentCalculation) error {
	ctx := context.Background()
	paymentJSON, err := json.Marshal(payment)
	if err != nil {
		return err
	}

	return ps.redisClient.Set(ctx, fmt.Sprintf("payment:%s", payment.ClaimID), paymentJSON, 0).Err()
}

func (ps *PaymentService) getStoredPayments() ([]PaymentCalculation, error) {
	ctx := context.Background()
	keys, err := ps.redisClient.Keys(ctx, "payment:*").Result()
	if err != nil {
		return nil, err
	}

	var payments []PaymentCalculation
	for _, key := range keys {
		paymentJSON, err := ps.redisClient.Get(ctx, key).Result()
		if err != nil {
			continue
		}

		var payment PaymentCalculation
		if err := json.Unmarshal([]byte(paymentJSON), &payment); err != nil {
			continue
		}

		payments = append(payments, payment)
	}

	return payments, nil
}

func (ps *PaymentService) backgroundTasks() {
	time.Sleep(5 * time.Second) // Wait for app to start

	// Register with gateway
	if err := ps.registerWithGateway(); err != nil {
		log.Printf("⚠️ Failed to register with gateway, continuing anyway: %v", err)
	}

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Send heartbeat
			if err := ps.sendHeartbeat(); err != nil {
				// Don't log heartbeat failures unless registered
			}

			// Poll for new claims
			claims, err := ps.pollForClaims()
			if err != nil {
				log.Printf("Failed to poll for claims: %v", err)
				continue
			}

			// Process claims and store in Redis for web UI
			for _, claim := range claims {
				// Check if already processed
				ctx := context.Background()
				exists := ps.redisClient.Exists(ctx, fmt.Sprintf("payment:%s", claim.ClaimReferenceID)).Val()
				if exists > 0 {
					continue // Skip already processed claims
				}

				// Calculate benefits and store
				payment := ps.calculateBenefits(claim)
				if err := ps.storePayment(payment); err != nil {
					log.Printf("Failed to store payment calculation: %v", err)
				} else {
					log.Printf("💰 Prepared payment calculation for claim %s - WBA: $%.2f", 
						claim.ClaimReferenceID, payment.WeeklyBenefitAmount)
				}
			}
		}
	}
}

func setupRoutes(ps *PaymentService) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// Load HTML templates
	r.LoadHTMLGlob("templates/*")

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":    "UP",
			"service":   "paymentservices",
			"timestamp": time.Now().Format(time.RFC3339),
			"protocol":  "HTTP",
			"port":      ps.servicePort,
		})
	})

	// Main dashboard
	r.GET("/", func(c *gin.Context) {
		payments, err := ps.getStoredPayments()
		if err != nil {
			log.Printf("Error getting payments: %v", err)
			payments = []PaymentCalculation{}
		}

		// Count by status
		pendingCount := 0
		processedCount := 0
		for _, p := range payments {
			if p.Status == "PENDING_CONFIRMATION" {
				pendingCount++
			} else {
				processedCount++
			}
		}

		c.HTML(200, "dashboard.html", gin.H{
			"payments":       payments,
			"pendingCount":   pendingCount,
			"processedCount": processedCount,
			"totalPayments":  len(payments),
		})
	})

	// Confirm payment
	r.POST("/confirm/:claimId", func(c *gin.Context) {
		claimId := c.Param("claimId")
		
		ctx := context.Background()
		paymentJSON, err := ps.redisClient.Get(ctx, fmt.Sprintf("payment:%s", claimId)).Result()
		if err != nil {
			c.JSON(404, gin.H{"error": "Payment not found"})
			return
		}

		var payment PaymentCalculation
		if err := json.Unmarshal([]byte(paymentJSON), &payment); err != nil {
			c.JSON(500, gin.H{"error": "Failed to parse payment"})
			return
		}

		// Update status to PAID
		payment.Status = "PAID"
		payment.ProcessedAt = time.Now()

		// Store updated payment
		if err := ps.storePayment(payment); err != nil {
			c.JSON(500, gin.H{"error": "Failed to update payment"})
			return
		}

		// Send update to Camel Gateway
		if err := ps.updateClaimPayment(payment); err != nil {
			log.Printf("Failed to update Camel: %v", err)
		}

		c.JSON(200, gin.H{"success": true, "message": "Payment confirmed"})
	})

	return r
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	log.Println("🚀 Starting Payment Services...")

	ps := NewPaymentService()

	// Test Redis connection
	ctx := context.Background()
	if err := ps.redisClient.Ping(ctx).Err(); err != nil {
		log.Printf("⚠️ Redis connection failed: %v", err)
		log.Println("Continuing without Redis...")
	} else {
		log.Println("✅ Redis connected successfully")
	}

	// Start background tasks
	go ps.backgroundTasks()

	// Setup web server
	r := setupRoutes(ps)

	port := ps.servicePort
	log.Printf("🌐 HTTP server running on port %s", port)
	log.Printf("📊 Dashboard: http://localhost:%s", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
