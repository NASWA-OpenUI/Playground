FROM openjdk:17-jdk-slim

# Install maven to build the application
RUN apt-get update && apt-get install -y maven

# Create app directory
WORKDIR /opt/camel

# Copy the project files
COPY pom.xml .
COPY src ./src

# Build the application
RUN mvn clean compile

# Expose ports
EXPOSE 8080 8081

# Run the application
CMD ["mvn", "exec:java", "-Dexec.mainClass=com.playground.camel.CamelGatewayApp"]
