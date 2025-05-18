# Apache Camel Unified Gateway - Dockerfile
FROM openjdk:11-jre-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy Maven wrapper and pom.xml first (for better Docker layer caching)
COPY mvnw .
COPY mvnw.cmd .
COPY pom.xml .

# Create .mvn/wrapper directory and download maven-wrapper.jar if needed
RUN mkdir -p .mvn/wrapper

# Make maven wrapper executable
RUN chmod +x ./mvnw

# Download dependencies (this layer will be cached unless pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Expose ports
EXPOSE 8080
EXPOSE 8778
EXPOSE 9779

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/integration/api/v1/health || exit 1

# Run the application
CMD ["java", "-jar", "target/camel-unified-gateway-1.0.0.jar"]
