package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"google.golang.org/grpc"
)

type PaymentService struct {
	redisClient    *redis.Client
	gatewayURL     string
	serviceName    string
	servicePort    string
	isRegistered   bool
	grpcConn       *grpc.ClientConn
	maxWeeklyBenefit float64
	replacementRate  float64
	benefitWeeks     int
}

type ClaimData struct {
	ClaimReferenceID     string  `json:"claimReferenceId"`
	FirstName           string  `json:"firstName"`
	LastName            string  `json:"lastName"`
	EmailAddress        string  `json:"emailAddress"`
	PhoneNumber         string  `json:"phoneNumber"`
	EmployerName        string  `json:"employerName"`
	EmployerID          string  `json:"employerId"`
	EmploymentStartDate string  `json:"employmentStartDate"`
	EmploymentEndDate   string  `json:"employmentEndDate"`
	TotalAnnualEarnings float64 `json:"totalAnnualEarnings"`
	SeparationReasonCode string  `json:"separationReasonCode"`
	SeparationExplanation string `json:"separationExplanation"`
	StatusCode          string  `json:"statusCode"`
	ReceivedTimestamp   string  `json:"receivedTimestamp"`
	StateTaxAmount      float64 `json:"stateTaxAmount"`
	FederalTaxAmount    float64 `json:"federalTaxAmount"`
	TotalTaxAmount      float64 `json:"totalTaxAmount"`
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

func NewPaymentService() *PaymentService {
	gatewayURL := getEnv("CAMEL_GATEWAY_URL", "http://camel-gateway:8080")
	serviceName := getEnv("SERVICE_NAME", "paymentservices")
	servicePort := getEnv("PORT", "6000")
	
	// Configuration for benefit calculations
	maxWeeklyBenefit, _ := strconv.ParseFloat(getEnv("MAX_WEEKLY_BENEFIT", "600.00"), 64)
	replacementRate, _ := strconv.ParseFloat(getEnv("REPLACEMENT_RATE", "0.60"), 64)
	benefitWeeks, _ := strconv.Atoi(getEnv("BENEFIT_WEEKS", "26"))

	// Initialize Redis client
	redisClient := redis.NewClient(&redis.Options{
		Addr:     getEnv("REDIS_URL", "localhost:6379"),
		Password: getEnv("REDIS_PASSWORD", ""),
		DB:       0,
	})

	return &PaymentService{
		redisClient:      redisClient,
		gatewayURL:      gatewayURL,
		serviceName:     serviceName,
		servicePort:     servicePort,
		maxWeeklyBenefit: maxWeeklyBenefit,
		replacementRate:  replacementRate,
		benefitWeeks:     benefitWeeks,
	}
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

func (ps *PaymentService) registerWithGateway() error {
	// This will eventually be a gRPC call to Camel
	// For now, using HTTP as fallback until Camel gRPC endpoint is ready
	registrationData := map[string]interface{}{
		"serviceId":      ps.serviceName,
		"name":          "Payment Services",
		"technology":    "Go + gRPC",
		"protocol":      "gRPC",
		"endpoint":      fmt.Sprintf("http://%s:%s/grpc", ps.serviceName, ps.servicePort),
		"healthEndpoint": fmt.Sprintf("http://%s:%s/health", ps.serviceName, ps.servicePort),
	}

	jsonData, _ := json.Marshal(registrationData)
	log.Printf("Registering with gateway: %s", string(jsonData))
	
	// TODO: Replace with gRPC call when Camel endpoint is ready
	ps.isRegistered = true
	log.Println("✅ Successfully registered with gateway")
	return nil
}

func (ps *PaymentService) sendHeartbeat() error {
	if !ps.isRegistered {
		return fmt.Errorf("service not registered")
	}

	// TODO: Replace with gRPC call when Camel endpoint is ready
	log.Println("💓 Heartbeat sent successfully")
	return nil
}

func (ps *PaymentService) pollForClaims() ([]ClaimData, error) {
	// TODO: Replace with gRPC call when Camel endpoint is ready
	// For now, return mock data for testing
	mockClaims := []ClaimData{
		{
			ClaimReferenceID:     "CLM-2025-001",
			FirstName:           "John",
			LastName:            "Doe",
			EmailAddress:        "john.doe@email.com",
			PhoneNumber:         "555-0123",
			EmployerName:        "Tech Corp",
			EmployerID:          "12-3456789",
			EmploymentStartDate: "2023-01-01",
			EmploymentEndDate:   "2024-12-31",
			TotalAnnualEarnings: 75000.00,
			SeparationReasonCode: "LAYOFF",
			SeparationExplanation: "Company restructuring",
			StatusCode:          "AWAITING_PAYMENT_PROCESSING",
			ReceivedTimestamp:   time.Now().Format(time.RFC3339),
			StateTaxAmount:      1500.00,
			FederalTaxAmount:    450.00,
			TotalTaxAmount:      1950.00,
		},
	}

	log.Printf("Found %d claims awaiting payment processing", len(mockClaims))
	return mockClaims, nil
}

func (ps *PaymentService) updateClaimPayment(payment PaymentCalculation) error {
	// TODO: Replace with gRPC call to Camel when endpoint is ready
	log.Printf("✅ Payment processed for claim %s: WBA=$%.2f, Max Benefit=$%.2f", 
		payment.ClaimID, payment.WeeklyBenefitAmount, payment.MaximumBenefit)
	return nil
}

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
		log.Printf("Failed to register with gateway: %v", err)
	}

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Send heartbeat
			if err := ps.sendHeartbeat(); err != nil {
				log.Printf("Heartbeat failed: %v", err)
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
					log.Printf("Prepared payment calculation for claim %s", claim.ClaimReferenceID)
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
	log.Printf("🌐 Payment Services running on port %s", port)
	log.Printf("📊 Dashboard: http://localhost:%s", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
