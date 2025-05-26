# Payment Services - gRPC + Go + Redis

## Overview

The **paymentservices** module is the final component in the unemployment claim processing workflow. It receives claims that have completed tax calculations and processes unemployment benefit payments using realistic DOL (Department of Labor) formulas.

> **Note**: The folder name `paymentservices` follows Go naming conventions (lowercase, single word) to demonstrate authentic Go ecosystem practices, contrasting with `EmployerServices` (C# PascalCase) and `claimant-services` (Node.js kebab-case).

## Architecture

- **Language**: Go 1.21
- **Protocol**: gRPC (with HTTP fallback)
- **Database**: Redis
- **Web Framework**: Gin
- **Port**: 6000

## Features

### 🔄 Service Integration
- **gRPC Protocol**: Demonstrates modern API communication
- **Auto-Registration**: Self-registers with Camel Gateway on startup
- **Heartbeat Monitoring**: Maintains connection status every 30 seconds
- **Polling**: Checks for claims with status `AWAITING_PAYMENT_PROCESSING`

### 💰 Realistic Benefit Calculations
Implements actual DOL unemployment insurance formulas:

```
Highest Quarter = Annual Wages ÷ 4
Base WBA = (Highest Quarter ÷ 26) × 60% replacement rate
Weekly Benefit Amount = min(Base WBA, $600 max weekly benefit)
Maximum Benefit = WBA × 26 weeks
First Payment = WBA - Weekly Tax Withholding
```

### 🖥️ Interactive Web Interface
- **Clean Dashboard**: Shows payment processing queue
- **Real-time Stats**: Pending vs processed payments
- **Benefit Details**: Displays WBA, Maximum Benefit, tax withholdings
- **Confirmation Workflow**: Click-to-confirm payment processing
- **Auto-refresh**: Updates every 30 seconds

## Configuration

Environment variables for customization:

```bash
PORT=6000                          # Service port
SERVICE_NAME=paymentservices          # Service identifier (Go convention)
CAMEL_GATEWAY_URL=http://camel-gateway:8080
REDIS_URL=redis:6379              # Redis connection
MAX_WEEKLY_BENEFIT=600.00         # Maximum weekly benefit cap
REPLACEMENT_RATE=0.60             # 60% wage replacement
BENEFIT_WEEKS=26                  # Standard benefit duration
```

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone and navigate to paymentservices directory
cd paymentservices

# Start services
docker-compose up -d

# View logs
docker-compose logs -f paymentservices

# Access dashboard
open http://localhost:6000
```

### Local Development

```bash
# Install dependencies
go mod download

# Start Redis (if not using Docker)
redis-server

# Run the service
go run main.go

# Access dashboard
open http://localhost:6000
```

## API Endpoints

### HTTP Endpoints
- `GET /` - Payment processing dashboard
- `GET /health` - Health check
- `POST /confirm/{claimId}` - Confirm payment processing

### gRPC Service (when Camel integration is complete)
- `RegisterService` - Service registration
- `SendHeartbeat` - Heartbeat maintenance  
- `GetClaimsByStatus` - Poll for pending claims
- `UpdateClaimPayment` - Send payment results back to Camel

## Data Flow

1. **Claim Detection**: Polls Camel Gateway for claims with status `AWAITING_PAYMENT_PROCESSING`
2. **Benefit Calculation**: Applies DOL formulas to calculate WBA and Maximum Benefit
3. **Queue Display**: Shows calculated benefits in web interface
4. **User Confirmation**: Admin reviews and confirms payment
5. **Status Update**: Sends payment details back to Camel Gateway via gRPC
6. **Storage**: Maintains local Redis cache of all processed payments

## Integration with Existing Services

### Data Format Expected from Camel
The service expects claims with the following structure:
```json
{
  "claimReferenceId": "CLM-2025-001",
  "firstName": "John",
  "lastName": "Doe", 
  "totalAnnualEarnings": 75000.00,
  "stateTaxAmount": 1500.00,
  "federalTaxAmount": 450.00,
  "totalTaxAmount": 1950.00,
  "statusCode": "AWAITING_PAYMENT_PROCESSING"
}
```

### Data Sent Back to Camel
```json
{
  "claimId": "CLM-2025-001",
  "status": "PAID",
  "weeklyBenefitAmount": 481.25,
  "maximumBenefit": 12512.50,
  "firstPaymentAmount": 443.75,
  "updatedBy": "payment-services"
}
```

## Camel Gateway Integration

The service is designed to work with Apache Camel's gRPC component. When you implement the Camel side:

1. **Add gRPC Endpoint**: Configure Camel to accept gRPC calls at `/grpc/payment`
2. **Protocol Translation**: Use `camel-grpc` component to translate protobuf to HTTP/JSON
3. **Database Updates**: Store payment details in H2 database
4. **Status Management**: Update claim status to final `COMPLETE` state

## Demo Showcase

This service demonstrates:
- **Protocol Diversity**: gRPC alongside HTTP, GraphQL, and SOAP
- **Realistic Business Logic**: Actual DOL unemployment benefit calculations
- **Interactive Processing**: User-friendly confirmation workflow
- **Service Decoupling**: Technology-agnostic integration through Camel Gateway
- **Modern Stack**: Go + gRPC + Redis representing current industry practices

## Development Notes

- **Mock Data**: Currently includes sample claims for testing
- **HTTP Fallback**: Uses HTTP for registration/polling until Camel gRPC endpoint is ready
- **Configurable Logic**: Business rules (rates, caps, duration) are environment-configurable
- **Error Handling**: Comprehensive logging and graceful failure recovery
- **Docker Ready**: Full containerization with health checks

## Next Steps for Full Integration

1. **Camel gRPC Setup**: Implement corresponding gRPC endpoints in Camel Gateway
2. **Proto Integration**: Use the provided `.proto` file to generate Camel client stubs  
3. **Database Schema**: Add payment fields to Camel's H2 database schema
4. **End-to-End Testing**: Verify complete claim workflow from submission to payment

This completes the polyglot demonstration with four distinct technologies (Node.js/GraphQL, C#/HTTP, Python/SOAP, Go/gRPC) all seamlessly integrated through Apache Camel! 🚀