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
	"google.golang.org/grpc/credentials/insecure"

	pb "paymentservices/proto" // Import the generated protobuf package
)

type PaymentService struct {
	redisClient       *redis.Client
	gatewayURL        string
	gatewayGrpcURL    string
	serviceName       string
	servicePort       string
	isRegistered      bool
	grpcConn          *grpc.ClientConn
	grpcClient        pb.PaymentServiceClient
	maxWeeklyBenefit  float64
	replacementRate   float64
	benefitWeeks      int
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

func NewPaymentService() *PaymentService {
	gatewayURL := getEnv("CAMEL_GATEWAY_URL", "http://camel-gateway:8080")
	gatewayGrpcURL := getEnv("CAMEL_GATEWAY_GRPC_URL", "camel-gateway:9090")
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
		gatewayGrpcURL:  gatewayGrpcURL,
		serviceName:     serviceName,
		servicePort:     servicePort,
		maxWeeklyBenefit: maxWeeklyBenefit,
		replacementRate:  replacementRate,
		benefitWeeks:     benefitWeeks,
	}
}

func (ps *PaymentService) initGrpcConnection() error {
	log.Printf("Connecting to Camel Gateway gRPC at %s", ps.gatewayGrpcURL)
	
	// Create gRPC connection with insecure credentials for internal service communication
	conn, err := grpc.Dial(ps.gatewayGrpcURL, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return fmt.Errorf("failed to connect to gRPC server: %v", err)
	}
	
	ps.grpcConn = conn
	ps.grpcClient = pb.NewPaymentServiceClient(conn)
	
	log.Println("✅ gRPC connection established")
	return nil
}

func (ps *PaymentService) closeGrpcConnection() {
	if ps.grpcConn != nil {
		ps.grpcConn.Close()
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
	if ps.grpcClient == nil {
		return fmt.Errorf("gRPC client not initialized")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	request := &pb.RegisterRequest{
		ServiceId:      ps.serviceName,
		Name:          "Payment Services",
		Technology:    "Go + gRPC",
		Protocol:      "gRPC",
		Endpoint:      fmt.Sprintf("%s:%s", ps.serviceName, ps.servicePort),
		HealthEndpoint: fmt.Sprintf("http://%s:%s/health", ps.serviceName, ps.servicePort),
	}

	log.Printf("🔄 Registering with Camel Gateway via gRPC...")
	response, err := ps.grpcClient.RegisterService(ctx, request)
	if err != nil {
		return fmt.Errorf("registration failed: %v", err)
	}

	if response.Success {
		ps.isRegistered = true
		log.Printf("✅ Successfully registered with gateway: %s", response.Message)
	} else {
		return fmt.Errorf("registration rejected: %s", response.Message)
	}

	return nil
}

func (ps *PaymentService) sendHeartbeat() error {
	if !ps.isRegistered || ps.grpcClient == nil {
		return fmt.Errorf("service not registered or gRPC client not available")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	request := &pb.HeartbeatRequest{
		ServiceId: ps.serviceName,
		Timestamp: time.Now().Format(time.RFC3339),
		Status:    "UP",
	}

	response, err := ps.grpcClient.SendHeartbeat(ctx, request)
	if err != nil {
		return fmt.Errorf("heartbeat failed: %v", err)
	}

	if response.Success {
		log.Printf("💓 Heartbeat sent successfully: %s", response.Message)
	} else {
		log.Printf("⚠️ Heartbeat warning: %s", response.Message)
	}

	return nil
}

func (ps *PaymentService) pollForClaims() ([]ClaimData, error) {
	if ps.grpcClient == nil {
		// Fallback to mock data if gRPC not available
		return ps.getMockClaims(), nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	request := &pb.StatusRequest{
		Status: "AWAITING_PAYMENT_PROCESSING",
	}

	response, err := ps.grpcClient.GetClaimsByStatus(ctx, request)
	if err != nil {
		log.Printf("⚠️ gRPC call failed, using mock data: %v", err)
		return ps.getMockClaims(), nil
	}

	if !response.Success {
		log.Printf("⚠️ Claims query unsuccessful: %s", response.Message)
		return ps.getMockClaims(), nil
	}

	// Convert protobuf claims to our internal structure
	var claims []ClaimData
	for _, pbClaim := range response.Claims {
		claim := ClaimData{
			ClaimReferenceID:      pbClaim.ClaimReferenceId,
			FirstName:            pbClaim.FirstName,
			LastName:             pbClaim.LastName,
			EmailAddress:         pbClaim.EmailAddress,
			PhoneNumber:          pbClaim.PhoneNumber,
			EmployerName:         pbClaim.EmployerName,
			EmployerID:           pbClaim.EmployerId,
			EmploymentStartDate:  pbClaim.EmploymentStartDate,
			EmploymentEndDate:    pbClaim.EmploymentEndDate,
			TotalAnnualEarnings:  pbClaim.TotalAnnualEarnings,
			SeparationReasonCode: pbClaim.SeparationReasonCode,
			SeparationExplanation: pbClaim.SeparationExplanation,
			StatusCode:           pbClaim.StatusCode,
			ReceivedTimestamp:    pbClaim.ReceivedTimestamp,
			StateTaxAmount:       pbClaim.StateTaxAmount,
			FederalTaxAmount:     pbClaim.FederalTaxAmount,
			TotalTaxAmount:       pbClaim.TotalTaxAmount,
		}
		claims = append(claims, claim)
	}

	log.Printf("📋 Found %d claims awaiting payment processing via gRPC", len(claims))
	return claims, nil
}

func (ps *PaymentService) getMockClaims() []ClaimData {
	return []ClaimData{
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
}

func (ps *PaymentService) updateClaimPayment(payment PaymentCalculation) error {
	if ps.grpcClient == nil {
		log.Printf("⚠️ gRPC client not available, would send payment update:")
		ps.logPaymentUpdate(payment)
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	request := &pb.PaymentUpdateRequest{
		ClaimId:             payment.ClaimID,
		Status:              "PAID",
		WeeklyBenefitAmount: payment.WeeklyBenefitAmount,
		MaximumBenefit:      payment.MaximumBenefit,
		FirstPaymentAmount:  payment.FirstPaymentAmount,
		UpdatedBy:           "paymentservices",
		Notes: fmt.Sprintf("Payment processed. WBA: $%.2f, Max Benefit: $%.2f, First Payment: $%.2f", 
			payment.WeeklyBenefitAmount, payment.MaximumBenefit, payment.FirstPaymentAmount),
	}

	log.Printf("🔄 Sending payment update to Camel Gateway via gRPC...")
	response, err := ps.grpcClient.UpdateClaimPayment(ctx, request)
	if err != nil {
		return fmt.Errorf("payment update failed: %v", err)
	}

	if response.Success {
		log.Printf("✅ Payment update successful: %s", response.Message)
	} else {
		log.Printf("⚠️ Payment update warning: %s", response.Message)
	}

	log.Printf("✅ Payment processed for claim %s: WBA=$%.2f, Max Benefit=$%.2f", 
		payment.ClaimID, payment.WeeklyBenefitAmount, payment.MaximumBenefit)
	
	return nil
}

func (ps *PaymentService) logPaymentUpdate(payment PaymentCalculation) {
	paymentUpdate := map[string]interface{}{
		"claimId":             payment.ClaimID,
		"statusCode":          "PAID",
		"statusDisplayName":   "Payment Processed", 
		"weeklyBenefitAmount": payment.WeeklyBenefitAmount,
		"maximumBenefit":      payment.MaximumBenefit,
		"firstPaymentAmount":  payment.FirstPaymentAmount,
		"updatedBy":           "paymentservices",
		"notes": fmt.Sprintf("Payment processed. WBA: $%.2f, Max Benefit: $%.2f, First Payment: $%.2f", 
			payment.WeeklyBenefitAmount, payment.MaximumBenefit, payment.FirstPaymentAmount),
	}

	paymentJSON, _ := json.Marshal(paymentUpdate)
	log.Printf("   Endpoint: %s", ps.gatewayGrpcURL)
	log.Printf("   Method: UpdateClaimPayment") 
	log.Printf("   Payload: %s", string(paymentJSON))
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

	// Initialize gRPC connection
	if err := ps.initGrpcConnection(); err != nil {
		log.Printf("⚠️ Failed to initialize gRPC connection: %v", err)
		log.Println("Will continue with limited functionality...")
	}

	// Register with gateway
	if err := ps.registerWithGateway(); err != nil {
		log.Printf("⚠️ Failed to register with gateway: %v", err)
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
			"grpc":      ps.grpcClient != nil,
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

	// Ensure gRPC connection is closed on exit
	defer ps.closeGrpcConnection()

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

type Claim struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	ClaimReferenceId      string  `protobuf:"bytes,1,opt,name=claim_reference_id,json=claimReferenceId,proto3" json:"claim_reference_id,omitempty"`
	FirstName             string  `protobuf:"bytes,2,opt,name=first_name,json=firstName,proto3" json:"first_name,omitempty"`
	LastName              string  `protobuf:"bytes,3,opt,name=last_name,json=lastName,proto3" json:"last_name,omitempty"`
	EmailAddress          string  `protobuf:"bytes,4,opt,name=email_address,json=emailAddress,proto3" json:"email_address,omitempty"`
	PhoneNumber           string  `protobuf:"bytes,5,opt,name=phone_number,json=phoneNumber,proto3" json:"phone_number,omitempty"`
	EmployerName          string  `protobuf:"bytes,6,opt,name=employer_name,json=employerName,proto3" json:"employer_name,omitempty"`
	EmployerId            string  `protobuf:"bytes,7,opt,name=employer_id,json=employerId,proto3" json:"employer_id,omitempty"`
	EmploymentStartDate   string  `protobuf:"bytes,8,opt,name=employment_start_date,json=employmentStartDate,proto3" json:"employment_start_date,omitempty"`
	EmploymentEndDate     string  `protobuf:"bytes,9,opt,name=employment_end_date,json=employmentEndDate,proto3" json:"employment_end_date,omitempty"`
	TotalAnnualEarnings   float64 `protobuf:"fixed64,10,opt,name=total_annual_earnings,json=totalAnnualEarnings,proto3" json:"total_annual_earnings,omitempty"`
	SeparationReasonCode  string  `protobuf:"bytes,11,opt,name=separation_reason_code,json=separationReasonCode,proto3" json:"separation_reason_code,omitempty"`
	SeparationExplanation string  `protobuf:"bytes,12,opt,name=separation_explanation,json=separationExplanation,proto3" json:"separation_explanation,omitempty"`
	StatusCode            string  `protobuf:"bytes,13,opt,name=status_code,json=statusCode,proto3" json:"status_code,omitempty"`
	ReceivedTimestamp     string  `protobuf:"bytes,14,opt,name=received_timestamp,json=receivedTimestamp,proto3" json:"received_timestamp,omitempty"`
	StateTaxAmount        float64 `protobuf:"fixed64,15,opt,name=state_tax_amount,json=stateTaxAmount,proto3" json:"state_tax_amount,omitempty"`
	FederalTaxAmount      float64 `protobuf:"fixed64,16,opt,name=federal_tax_amount,json=federalTaxAmount,proto3" json:"federal_tax_amount,omitempty"`
	TotalTaxAmount        float64 `protobuf:"fixed64,17,opt,name=total_tax_amount,json=totalTaxAmount,proto3" json:"total_tax_amount,omitempty"`
}

func (x *Claim) Reset() {
	*x = Claim{}
	if protoimpl.UnsafeEnabled {
		mi := &file_payment_proto_msgTypes[5]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *Claim) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Claim) ProtoMessage() {}

func (x *Claim) ProtoReflect() protoreflect.Message {
	mi := &file_payment_proto_msgTypes[5]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Claim.ProtoReflect.Descriptor instead.
func (*Claim) Descriptor() ([]byte, []int) {
	return file_payment_proto_rawDescGZIP, []int{5}
}

func (x *Claim) GetClaimReferenceId() string {
	if x != nil {
		return x.ClaimReferenceId
	}
	return ""
}

func (x *Claim) GetFirstName() string {
	if x != nil {
		return x.FirstName
	}
	return ""
}

func (x *Claim) GetLastName() string {
	if x != nil {
		return x.LastName
	}
	return ""
}

func (x *Claim) GetEmailAddress() string {
	if x != nil {
		return x.EmailAddress
	}
	return ""
}

func (x *Claim) GetPhoneNumber() string {
	if x != nil {
		return x.PhoneNumber
	}
	return ""
}

func (x *Claim) GetEmployerName() string {
	if x != nil {
		return x.EmployerName
	}
	return ""
}

func (x *Claim) GetEmployerId() string {
	if x != nil {
		return x.EmployerId
	}
	return ""
}

func (x *Claim) GetEmploymentStartDate() string {
	if x != nil {
		return x.EmploymentStartDate
	}
	return ""
}

func (x *Claim) GetEmploymentEndDate() string {
	if x != nil {
		return x.EmploymentEndDate
	}
	return ""
}

func (x *Claim) GetTotalAnnualEarnings() float64 {
	if x != nil {
		return x.TotalAnnualEarnings
	}
	return 0
}

func (x *Claim) GetSeparationReasonCode() string {
	if x != nil {
		return x.SeparationReasonCode
	}
	return ""
}

func (x *Claim) GetSeparationExplanation() string {
	if x != nil {
		return x.SeparationExplanation
	}
	return ""
}

func (x *Claim) GetStatusCode() string {
	if x != nil {
		return x.StatusCode
	}
	return ""
}

func (x *Claim) GetReceivedTimestamp() string {
	if x != nil {
		return x.ReceivedTimestamp
	}
	return ""
}

func (x *Claim) GetStateTaxAmount() float64 {
	if x != nil {
		return x.StateTaxAmount
	}
	return 0
}

func (x *Claim) GetFederalTaxAmount() float64 {
	if x != nil {
		return x.FederalTaxAmount
	}
	return 0
}

func (x *Claim) GetTotalTaxAmount() float64 {
	if x != nil {
		return x.TotalTaxAmount
	}
	return 0
}

type ClaimsResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Claims  []*Claim `protobuf:"bytes,1,rep,name=claims,proto3" json:"claims,omitempty"`
	Success bool     `protobuf:"varint,2,opt,name=success,proto3" json:"success,omitempty"`
	Message string   `protobuf:"bytes,3,opt,name=message,proto3" json:"message,omitempty"`
}

func (x *ClaimsResponse) Reset() {
	*x = ClaimsResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_payment_proto_msgTypes[6]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *ClaimsResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ClaimsResponse) ProtoMessage() {}

func (x *ClaimsResponse) ProtoReflect() protoreflect.Message {
	mi := &file_payment_proto_msgTypes[6]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ClaimsResponse.ProtoReflect.Descriptor instead.
func (*ClaimsResponse) Descriptor() ([]byte, []int) {
	return file_payment_proto_rawDescGZIP, []int{6}
}

func (x *ClaimsResponse) GetClaims() []*Claim {
	if x != nil {
		return x.Claims
	}
	return nil
}

func (x *ClaimsResponse) GetSuccess() bool {
	if x != nil {
		return x.Success
	}
	return false
}

func (x *ClaimsResponse) GetMessage() string {
	if x != nil {
		return x.Message
	}
	return ""
}

// Payment Update Messages
type PaymentUpdateRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	ClaimId             string  `protobuf:"bytes,1,opt,name=claim_id,json=claimId,proto3" json:"claim_id,omitempty"`
	Status              string  `protobuf:"bytes,2,opt,name=status,proto3" json:"status,omitempty"`
	WeeklyBenefitAmount float64 `protobuf:"fixed64,3,opt,name=weekly_benefit_amount,json=weeklyBenefitAmount,proto3" json:"weekly_benefit_amount,omitempty"`
	MaximumBenefit      float64 `protobuf:"fixed64,4,opt,name=maximum_benefit,json=maximumBenefit,proto3" json:"maximum_benefit,omitempty"`
	FirstPaymentAmount  float64 `protobuf:"fixed64,5,opt,name=first_payment_amount,json=firstPaymentAmount,proto3" json:"first_payment_amount,omitempty"`
	UpdatedBy           string  `protobuf:"bytes,6,opt,name=updated_by,json=updatedBy,proto3" json:"updated_by,omitempty"`
	Notes               string  `protobuf:"bytes,7,opt,name=notes,proto3" json:"notes,omitempty"`
}

func (x *PaymentUpdateRequest) Reset() {
	*x = PaymentUpdateRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_payment_proto_msgTypes[7]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *PaymentUpdateRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*PaymentUpdateRequest) ProtoMessage() {}

func (x *PaymentUpdateRequest) ProtoReflect() protoreflect.Message {
	mi := &file_payment_proto_msgTypes[7]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use PaymentUpdateRequest.ProtoReflect.Descriptor instead.
func (*PaymentUpdateRequest) Descriptor() ([]byte, []int) {
	return file_payment_proto_rawDescGZIP, []int{7}
}

func (x *PaymentUpdateRequest) GetClaimId() string {
	if x != nil {
		return x.ClaimId
	}
	return ""
}

func (x *PaymentUpdateRequest) GetStatus() string {
	if x != nil {
		return x.Status
	}
	return ""
}

func (x *PaymentUpdateRequest) GetWeeklyBenefitAmount() float64 {
	if x != nil {
		return x.WeeklyBenefitAmount
	}
	return 0
}

func (x *PaymentUpdateRequest) GetMaximumBenefit() float64 {
	if x != nil {
		return x.MaximumBenefit
	}
	return 0
}

func (x *PaymentUpdateRequest) GetFirstPaymentAmount() float64 {
	if x != nil {
		return x.FirstPaymentAmount
	}
	return 0
}

func (x *PaymentUpdateRequest) GetUpdatedBy() string {
	if x != nil {
		return x.UpdatedBy
	}
	return ""
}

func (x *PaymentUpdateRequest) GetNotes() string {
	if x != nil {
		return x.Notes
	}
	return ""
}

type PaymentUpdateResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Success bool   `protobuf:"varint,1,opt,name=success,proto3" json:"success,omitempty"`
	Message string `protobuf:"bytes,2,opt,name=message,proto3" json:"message,omitempty"`
}

func (x *PaymentUpdateResponse) Reset() {
	*x = PaymentUpdateResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_payment_proto_msgTypes[8]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *PaymentUpdateResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*PaymentUpdateResponse) ProtoMessage() {}

func (x *PaymentUpdateResponse) ProtoReflect() protoreflect.Message {
	mi := &file_payment_proto_msgTypes[8]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use PaymentUpdateResponse.ProtoReflect.Descriptor instead.
func (*PaymentUpdateResponse) Descriptor() ([]byte, []int) {
	return file_payment_proto_rawDescGZIP, []int{8}
}

func (x *PaymentUpdateResponse) GetSuccess() bool {
	if x != nil {
		return x.Success
	}
	return false
}

func (x *PaymentUpdateResponse) GetMessage() string {
	if x != nil {
		return x.Message
	}
	return ""
}

var File_payment_proto protoreflect.FileDescriptor

var file_payment_proto_rawDesc = []byte{
	0x0a, 0x0d, 0x70, 0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x2e, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x12,
	0x07, 0x70, 0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x22, 0xbb, 0x01, 0x0a, 0x0f, 0x52, 0x65, 0x67,
	0x69, 0x73, 0x74, 0x65, 0x72, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x1d, 0x0a, 0x0a,
	0x73, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x5f, 0x69, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09,
	0x52, 0x09, 0x73, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x49, 0x64, 0x12, 0x12, 0x0a, 0x04, 0x6e,
	0x61, 0x6d, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x12,
	0x1e, 0x0a, 0x0a, 0x74, 0x65, 0x63, 0x68, 0x6e, 0x6f, 0x6c, 0x6f, 0x67, 0x79, 0x18, 0x03, 0x20,
	0x01, 0x28, 0x09, 0x52, 0x0a, 0x74, 0x65, 0x63, 0x68, 0x6e, 0x6f, 0x6c, 0x6f, 0x67, 0x79, 0x12,
	0x1a, 0x0a, 0x08, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x63, 0x6f, 0x6c, 0x18, 0x04, 0x20, 0x01, 0x28,
	0x09, 0x52, 0x08, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x63, 0x6f, 0x6c, 0x12, 0x1a, 0x0a, 0x08, 0x65,
	0x6e, 0x64, 0x70, 0x6f, 0x69, 0x6e, 0x74, 0x18, 0x05, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x65,
	0x6e, 0x64, 0x70, 0x6f, 0x69, 0x6e, 0x74, 0x12, 0x27, 0x0a, 0x0f, 0x68, 0x65, 0x61, 0x6c, 0x74,
	0x68, 0x5f, 0x65, 0x6e, 0x64, 0x70, 0x6f, 0x69, 0x6e, 0x74, 0x18, 0x06, 0x20, 0x01, 0x28, 0x09,
	0x52, 0x0e, 0x68, 0x65, 0x61, 0x6c, 0x74, 0x68, 0x45, 0x6e, 0x64, 0x70, 0x6f, 0x69, 0x6e, 0x74,
	0x22, 0x46, 0x0a, 0x10, 0x52, 0x65, 0x67, 0x69, 0x73, 0x74, 0x65, 0x72, 0x52, 0x65, 0x73, 0x70,
	0x6f, 0x6e, 0x73, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73, 0x73, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x08, 0x52, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73, 0x73, 0x12, 0x18,
	0x0a, 0x07, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x07, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x22, 0x6c, 0x0a, 0x10, 0x48, 0x65, 0x61, 0x72,
	0x74, 0x62, 0x65, 0x61, 0x74, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x1d, 0x0a, 0x0a,
	0x73, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x5f, 0x69, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09,
	0x52, 0x09, 0x73, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x49, 0x64, 0x12, 0x1c, 0x0a, 0x09, 0x74,
	0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x09,
	0x74, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x12, 0x1b, 0x0a, 0x06, 0x73, 0x74, 0x61,
	0x74, 0x75, 0x73, 0x18, 0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06, 0x73, 0x74, 0x61, 0x74, 0x75,
	0x73, 0x22, 0x47, 0x0a, 0x11, 0x48, 0x65, 0x61, 0x72, 0x74, 0x62, 0x65, 0x61, 0x74, 0x52, 0x65,
	0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73,
	0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x08, 0x52, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73, 0x73,
	0x12, 0x18, 0x0a, 0x07, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28,
	0x09, 0x52, 0x07, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x22, 0x27, 0x0a, 0x0d, 0x53, 0x74,
	0x61, 0x74, 0x75, 0x73, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x12, 0x16, 0x0a, 0x06, 0x73,
	0x74, 0x61, 0x74, 0x75, 0x73, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06, 0x73, 0x74, 0x61,
	0x74, 0x75, 0x73, 0x22, 0xf5, 0x05, 0x0a, 0x05, 0x43, 0x6c, 0x61, 0x69, 0x6d, 0x12, 0x2c, 0x0a,
	0x12, 0x63, 0x6c, 0x61, 0x69, 0x6d, 0x5f, 0x72, 0x65, 0x66, 0x65, 0x72, 0x65, 0x6e, 0x63, 0x65,
	0x5f, 0x69, 0x64, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x10, 0x63, 0x6c, 0x61, 0x69, 0x6d,
	0x52, 0x65, 0x66, 0x65, 0x72, 0x65, 0x6e, 0x63, 0x65, 0x49, 0x64, 0x12, 0x1d, 0x0a, 0x0a, 0x66,
	0x69, 0x72, 0x73, 0x74, 0x5f, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x09, 0x66, 0x69, 0x72, 0x73, 0x74, 0x4e, 0x61, 0x6d, 0x65, 0x12, 0x1b, 0x0a, 0x09, 0x6c, 0x61,
	0x73, 0x74, 0x5f, 0x6e, 0x61, 0x6d, 0x65, 0x18, 0x03, 0x20, 0x01, 0x28, 0x09, 0x52, 0x08, 0x6c,
	0x61, 0x73, 0x74, 0x4e, 0x61, 0x6d, 0x65, 0x12, 0x23, 0x0a, 0x0d, 0x65, 0x6d, 0x61, 0x69, 0x6c,
	0x5f, 0x61, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x18, 0x04, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0c,
	0x65, 0x6d, 0x61, 0x69, 0x6c, 0x41, 0x64, 0x64, 0x72, 0x65, 0x73, 0x73, 0x12, 0x21, 0x0a, 0x0c,
	0x70, 0x68, 0x6f, 0x6e, 0x65, 0x5f, 0x6e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x18, 0x05, 0x20, 0x01,
	0x28, 0x09, 0x52, 0x0b, 0x70, 0x68, 0x6f, 0x6e, 0x65, 0x4e, 0x75, 0x6d, 0x62, 0x65, 0x72, 0x12,
	0x23, 0x0a, 0x0d, 0x65, 0x6d, 0x70, 0x6c, 0x6f, 0x79, 0x65, 0x72, 0x5f, 0x6e, 0x61, 0x6d, 0x65,
	0x18, 0x06, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0c, 0x65, 0x6d, 0x70, 0x6c, 0x6f, 0x79, 0x65, 0x72,
	0x4e, 0x61, 0x6d, 0x65, 0x12, 0x1f, 0x0a, 0x0b, 0x65, 0x6d, 0x70, 0x6c, 0x6f, 0x79, 0x65, 0x72,
	0x5f, 0x69, 0x64, 0x18, 0x07, 0x20, 0x01, 0x28, 0x09, 0x52, 0x0a, 0x65, 0x6d, 0x70, 0x6c, 0x6f,
	0x79, 0x65, 0x72, 0x49, 0x64, 0x12, 0x32, 0x0a, 0x15, 0x65, 0x6d, 0x70, 0x6c, 0x6f, 0x79, 0x6d,
	0x65, 0x6e, 0x74, 0x5f, 0x73, 0x74, 0x61, 0x72, 0x74, 0x5f, 0x64, 0x61, 0x74, 0x65, 0x18, 0x08,
	0x20, 0x01, 0x28, 0x09, 0x52, 0x13, 0x65, 0x6d, 0x70, 0x6c, 0x6f, 0x79, 0x6d, 0x65, 0x6e, 0x74,
	0x53, 0x74, 0x61, 0x72, 0x74, 0x44, 0x61, 0x74, 0x65, 0x12, 0x2e, 0x0a, 0x13, 0x65, 0x6d, 0x70,
	0x6c, 0x6f, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x5f, 0x65, 0x6e, 0x64, 0x5f, 0x64, 0x61, 0x74, 0x65,
	0x18, 0x09, 0x20, 0x01, 0x28, 0x09, 0x52, 0x11, 0x65, 0x6d, 0x70, 0x6c, 0x6f, 0x79, 0x6d, 0x65,
	0x6e, 0x74, 0x45, 0x6e, 0x64, 0x44, 0x61, 0x74, 0x65, 0x12, 0x32, 0x0a, 0x15, 0x74, 0x6f, 0x74,
	0x61, 0x6c, 0x5f, 0x61, 0x6e, 0x6e, 0x75, 0x61, 0x6c, 0x5f, 0x65, 0x61, 0x72, 0x6e, 0x69, 0x6e,
	0x67, 0x73, 0x18, 0x0a, 0x20, 0x01, 0x28, 0x01, 0x52, 0x13, 0x74, 0x6f, 0x74, 0x61, 0x6c, 0x41,
	0x6e, 0x6e, 0x75, 0x61, 0x6c, 0x45, 0x61, 0x72, 0x6e, 0x69, 0x6e, 0x67, 0x73, 0x12, 0x32, 0x0a,
	0x15, 0x73, 0x65, 0x70, 0x61, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x5f, 0x72, 0x65, 0x61, 0x73,
	0x6f, 0x6e, 0x5f, 0x63, 0x6f, 0x64, 0x65, 0x18, 0x0b, 0x20, 0x01, 0x28, 0x09, 0x52, 0x13, 0x73,
	0x65, 0x70, 0x61, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x52, 0x65, 0x61, 0x73, 0x6f, 0x6e, 0x43,
	0x6f, 0x64, 0x65, 0x12, 0x35, 0x0a, 0x17, 0x73, 0x65, 0x70, 0x61, 0x72, 0x61, 0x74, 0x69, 0x6f,
	0x6e, 0x5f, 0x65, 0x78, 0x70, 0x6c, 0x61, 0x6e, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x18, 0x0c, 0x20,
	0x01, 0x28, 0x09, 0x52, 0x16, 0x73, 0x65, 0x70, 0x61, 0x72, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x45,
	0x78, 0x70, 0x6c, 0x61, 0x6e, 0x61, 0x74, 0x69, 0x6f, 0x6e, 0x12, 0x1f, 0x0a, 0x0b, 0x73, 0x74,
	0x61, 0x74, 0x75, 0x73, 0x5f, 0x63, 0x6f, 0x64, 0x65, 0x18, 0x0d, 0x20, 0x01, 0x28, 0x09, 0x52,
	0x0a, 0x73, 0x74, 0x61, 0x74, 0x75, 0x73, 0x43, 0x6f, 0x64, 0x65, 0x12, 0x2d, 0x0a, 0x12, 0x72,
	0x65, 0x63, 0x65, 0x69, 0x76, 0x65, 0x64, 0x5f, 0x74, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d,
	0x70, 0x18, 0x0e, 0x20, 0x01, 0x28, 0x09, 0x52, 0x11, 0x72, 0x65, 0x63, 0x65, 0x69, 0x76, 0x65,
	0x64, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x12, 0x28, 0x0a, 0x10, 0x73, 0x74,
	0x61, 0x74, 0x65, 0x5f, 0x74, 0x61, 0x78, 0x5f, 0x61, 0x6d, 0x6f, 0x75, 0x6e, 0x74, 0x18, 0x0f,
	0x20, 0x01, 0x28, 0x01, 0x52, 0x0e, 0x73, 0x74, 0x61, 0x74, 0x65, 0x54, 0x61, 0x78, 0x41, 0x6d,
	0x6f, 0x75, 0x6e, 0x74, 0x12, 0x2c, 0x0a, 0x12, 0x66, 0x65, 0x64, 0x65, 0x72, 0x61, 0x6c, 0x5f,
	0x74, 0x61, 0x78, 0x5f, 0x61, 0x6d, 0x6f, 0x75, 0x6e, 0x74, 0x18, 0x10, 0x20, 0x01, 0x28, 0x01,
	0x52, 0x10, 0x66, 0x65, 0x64, 0x65, 0x72, 0x61, 0x6c, 0x54, 0x61, 0x78, 0x41, 0x6d, 0x6f, 0x75,
	0x6e, 0x74, 0x12, 0x28, 0x0a, 0x10, 0x74, 0x6f, 0x74, 0x61, 0x6c, 0x5f, 0x74, 0x61, 0x78, 0x5f,
	0x61, 0x6d, 0x6f, 0x75, 0x6e, 0x74, 0x18, 0x11, 0x20, 0x01, 0x28, 0x01, 0x52, 0x0e, 0x74, 0x6f,
	0x74, 0x61, 0x6c, 0x54, 0x61, 0x78, 0x41, 0x6d, 0x6f, 0x75, 0x6e, 0x74, 0x22, 0x65, 0x0a, 0x0e,
	0x43, 0x6c, 0x61, 0x69, 0x6d, 0x73, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12, 0x29,
	0x0a, 0x06, 0x63, 0x6c, 0x61, 0x69, 0x6d, 0x73, 0x18, 0x01, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x11,
	0x2e, 0x70, 0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x2e, 0x43, 0x6c, 0x61, 0x69, 0x6d, 0x52, 0x06,
	0x63, 0x6c, 0x61, 0x69, 0x6d, 0x73, 0x12, 0x18, 0x0a, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73,
	0x73, 0x18, 0x02, 0x20, 0x01, 0x28, 0x08, 0x52, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73, 0x73,
	0x12, 0x18, 0x0a, 0x07, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x03, 0x20, 0x01, 0x28,
	0x09, 0x52, 0x07, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x22, 0x88, 0x02, 0x0a, 0x14, 0x50,
	0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x52, 0x65, 0x71, 0x75,
	0x65, 0x73, 0x74, 0x12, 0x19, 0x0a, 0x08, 0x63, 0x6c, 0x61, 0x69, 0x6d, 0x5f, 0x69, 0x64, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x63, 0x6c, 0x61, 0x69, 0x6d, 0x49, 0x64, 0x12, 0x16,
	0x0a, 0x06, 0x73, 0x74, 0x61, 0x74, 0x75, 0x73, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x06,
	0x73, 0x74, 0x61, 0x74, 0x75, 0x73, 0x12, 0x32, 0x0a, 0x15, 0x77, 0x65, 0x65, 0x6b, 0x6c, 0x79,
	0x5f, 0x62, 0x65, 0x6e, 0x65, 0x66, 0x69, 0x74, 0x5f, 0x61, 0x6d, 0x6f, 0x75, 0x6e, 0x74, 0x18,
	0x03, 0x20, 0x01, 0x28, 0x01, 0x52, 0x13, 0x77, 0x65, 0x65, 0x6b, 0x6c, 0x79, 0x42, 0x65, 0x6e,
	0x65, 0x66, 0x69, 0x74, 0x41, 0x6d, 0x6f, 0x75, 0x6e, 0x74, 0x12, 0x27, 0x0a, 0x0f, 0x6d, 0x61,
	0x78, 0x69, 0x6d, 0x75, 0x6d, 0x5f, 0x62, 0x65, 0x6e, 0x65, 0x66, 0x69, 0x74, 0x18, 0x04, 0x20,
	0x01, 0x28, 0x01, 0x52, 0x0e, 0x6d, 0x61, 0x78, 0x69, 0x6d, 0x75, 0x6d, 0x42, 0x65, 0x6e, 0x65,
	0x66, 0x69, 0x74, 0x12, 0x30, 0x0a, 0x14, 0x66, 0x69, 0x72, 0x73, 0x74, 0x5f, 0x70, 0x61, 0x79,
	0x6d, 0x65, 0x6e, 0x74, 0x5f, 0x61, 0x6d, 0x6f, 0x75, 0x6e, 0x74, 0x18, 0x05, 0x20, 0x01, 0x28,
	0x01, 0x52, 0x12, 0x66, 0x69, 0x72, 0x73, 0x74, 0x50, 0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x41,
	0x6d, 0x6f, 0x75, 0x6e, 0x74, 0x12, 0x1d, 0x0a, 0x0a, 0x75, 0x70, 0x64, 0x61, 0x74, 0x65, 0x64,
	0x5f, 0x62, 0x79, 0x18, 0x06, 0x20, 0x01, 0x28, 0x09, 0x52, 0x09, 0x75, 0x70, 0x64, 0x61, 0x74,
	0x65, 0x64, 0x42, 0x79, 0x12, 0x14, 0x0a, 0x05, 0x6e, 0x6f, 0x74, 0x65, 0x73, 0x18, 0x07, 0x20,
	0x01, 0x28, 0x09, 0x52, 0x05, 0x6e, 0x6f, 0x74, 0x65, 0x73, 0x22, 0x49, 0x0a, 0x15, 0x50, 0x61,
	0x79, 0x6d, 0x65, 0x6e, 0x74, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x52, 0x65, 0x73, 0x70, 0x6f,
	0x6e, 0x73, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73, 0x73, 0x18, 0x01,
	0x20, 0x01, 0x28, 0x08, 0x52, 0x07, 0x73, 0x75, 0x63, 0x63, 0x65, 0x73, 0x73, 0x12, 0x18, 0x0a,
	0x07, 0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07,
	0x6d, 0x65, 0x73, 0x73, 0x61, 0x67, 0x65, 0x32, 0xbe, 0x02, 0x0a, 0x0e, 0x50, 0x61, 0x79, 0x6d,
	0x65, 0x6e, 0x74, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x4b, 0x0a, 0x0f, 0x52, 0x65,
	0x67, 0x69, 0x73, 0x74, 0x65, 0x72, 0x53, 0x65, 0x72, 0x76, 0x69, 0x63, 0x65, 0x12, 0x18, 0x2e,
	0x70, 0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x2e, 0x52, 0x65, 0x67, 0x69, 0x73, 0x74, 0x65, 0x72,
	0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x1a, 0x19, 0x2e, 0x70, 0x61, 0x79, 0x6d, 0x65, 0x6e,
	0x74, 0x2e, 0x52, 0x65, 0x67, 0x69, 0x73, 0x74, 0x65, 0x72, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e,
	0x73, 0x65, 0x22, 0x03, 0x88, 0x02, 0x00, 0x12, 0x4c, 0x0a, 0x0d, 0x53, 0x65, 0x6e, 0x64, 0x48,
	0x65, 0x61, 0x72, 0x74, 0x62, 0x65, 0x61, 0x74, 0x12, 0x19, 0x2e, 0x70, 0x61, 0x79, 0x6d, 0x65,
	0x6e, 0x74, 0x2e, 0x48, 0x65, 0x61, 0x72, 0x74, 0x62, 0x65, 0x61, 0x74, 0x52, 0x65, 0x71, 0x75,
	0x65, 0x73, 0x74, 0x1a, 0x1a, 0x2e, 0x70, 0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x2e, 0x48, 0x65,
	0x61, 0x72, 0x74, 0x62, 0x65, 0x61, 0x74, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22,
	0x04, 0x88, 0x02, 0x00, 0x12, 0x48, 0x0a, 0x11, 0x47, 0x65, 0x74, 0x43, 0x6c, 0x61, 0x69, 0x6d,
	0x73, 0x42, 0x79, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x12, 0x16, 0x2e, 0x70, 0x61, 0x79, 0x6d,
	0x65, 0x6e, 0x74, 0x2e, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73,
	0x74, 0x1a, 0x17, 0x2e, 0x70, 0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x2e, 0x43, 0x6c, 0x61, 0x69,
	0x6d, 0x73, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x22, 0x02, 0x88, 0x02, 0x00, 0x12,
	0x51, 0x0a, 0x12, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x43, 0x6c, 0x61, 0x69, 0x6d, 0x50, 0x61,
	0x79, 0x6d, 0x65, 0x6e, 0x74, 0x12, 0x1d, 0x2e, 0x70, 0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x2e,
	0x50, 0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x52, 0x65, 0x71,
	0x75, 0x65, 0x73, 0x74, 0x1a, 0x1e, 0x2e, 0x70, 0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x2e, 0x50,
	0x61, 0x79, 0x6d, 0x65, 0x6e, 0x74, 0x55, 0x70, 0x64, 0x61, 0x74, 0x65, 0x52, 0x65, 0x73, 0x70,
	0x6f, 0x6e, 0x73, 0x65, 0x22, 0x00, 0x42, 0x09, 0x5a, 0x07, 0x2e, 0x2f, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_payment_proto_rawDescOnce sync.Once
	file_payment_proto_rawDescData = file_payment_proto_rawDesc
)

func file_payment_proto_rawDescGZIP() []byte {
	file_payment_proto_rawDescOnce.Do(func() {
		file_payment_proto_rawDescData = protoimpl.X.CompressGZIP(file_payment_proto_rawDescData)
	})
	return file_payment_proto_rawDescData
}

var file_payment_proto_msgTypes = make([]protoimpl.MessageInfo, 9)
var file_payment_proto_goTypes = []interface{}{
	(*RegisterRequest)(nil),       // 0: payment.RegisterRequest
	(*RegisterResponse)(nil),      // 1: payment.RegisterResponse
	(*HeartbeatRequest)(nil),      // 2: payment.HeartbeatRequest
	(*HeartbeatResponse)(nil),     // 3: payment.HeartbeatResponse
	(*StatusRequest)(nil),         // 4: payment.StatusRequest
	(*Claim)(nil),                 // 5: payment.Claim
	(*ClaimsResponse)(nil),        // 6: payment.ClaimsResponse
	(*PaymentUpdateRequest)(nil),  // 7: payment.PaymentUpdateRequest
	(*PaymentUpdateResponse)(nil), // 8: payment.PaymentUpdateResponse
}
var file_payment_proto_depIdxs = []int32{
	5, // 0: payment.ClaimsResponse.claims:type_name -> payment.Claim
	0, // 1: payment.PaymentService.RegisterService:input_type -> payment.RegisterRequest
	2, // 2: payment.PaymentService.SendHeartbeat:input_type -> payment.HeartbeatRequest
	4, // 3: payment.PaymentService.GetClaimsByStatus:input_type -> payment.StatusRequest
	7, // 4: payment.PaymentService.UpdateClaimPayment:input_type -> payment.PaymentUpdateRequest
	1, // 5: payment.PaymentService.RegisterService:output_type -> payment.RegisterResponse
	3, // 6: payment.PaymentService.SendHeartbeat:output_type -> payment.HeartbeatResponse
	6, // 7: payment.PaymentService.GetClaimsByStatus:output_type -> payment.ClaimsResponse
	8, // 8: payment.PaymentService.UpdateClaimPayment:output_type -> payment.PaymentUpdateResponse
	5, // [5:9] is the sub-list for method output_type
	1, // [1:5] is the sub-list for method input_type
	1, // [1:1] is the sub-list for extension type_name
	1, // [1:1] is the sub-list for extension extendee
	0, // [0:1] is the sub-list for field type_name
}

func init() { file_payment_proto_init() }
func file_payment_proto_init() {
	if File_payment_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_payment_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*RegisterRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_payment_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*RegisterResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_payment_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*HeartbeatRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_payment_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*HeartbeatResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_payment_proto_msgTypes[4].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*StatusRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_payment_proto_msgTypes[5].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*Claim); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_payment_proto_msgTypes[6].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*ClaimsResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_payment_proto_msgTypes[7].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*PaymentUpdateRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_payment_proto_msgTypes[8].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*PaymentUpdateResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_payment_proto_rawDesc,
		},
		GoTypes:           file_payment_proto_goTypes,
		DependencyIndexes: file_payment_proto_depIdxs,
		MessageInfos:      file_payment_proto_msgTypes,
	}.Build()
	File_payment_proto = out.File
	file_payment_proto_rawDesc = nil
	file_payment_proto_goTypes = nil
	file_payment_proto_depIdxs = nil
}
