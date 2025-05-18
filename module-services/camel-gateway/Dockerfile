# Simplified Dockerfile using Maven directly
FROM maven:3.8.6-openjdk-11-slim AS build

# Set working directory
WORKDIR /app

# Copy pom.xml and download dependencies (for better caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM openjdk:11-jre-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy the built jar from build stage (using correct artifact name from pom.xml)
COPY --from=build /app/target/camel-integration-service-1.0.0.jar app.jar

# Expose ports
EXPOSE 8080
EXPOSE 8778
EXPOSE 9779

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/integration/api/v1/health || exit 1

# Run the application
CMD ["java", "-jar", "app.jar"]
