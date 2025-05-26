# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy go mod files
COPY go.mod ./
# Copy go.sum if it exists (optional for initial build)
COPY go.su[m] ./

# Download dependencies and create go.sum
RUN go mod download
RUN go mod tidy

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o paymentservices .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/paymentservices .

# Copy templates
COPY --from=builder /app/templates ./templates

# Create necessary directories
RUN mkdir -p /tmp

# Set environment variables with defaults
ENV PORT=6000
ENV SERVICE_NAME=paymentservices
ENV CAMEL_GATEWAY_URL=http://camel-gateway:8080
ENV REDIS_URL=redis:6379
ENV MAX_WEEKLY_BENEFIT=600.00
ENV REPLACEMENT_RATE=0.60
ENV BENEFIT_WEEKS=26

# Expose port
EXPOSE 6000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:6000/health || exit 1

# Run the application
CMD ["./paymentservices"]
