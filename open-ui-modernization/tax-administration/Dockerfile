# tax-admin/Dockerfile
FROM openjdk:11-jdk-slim

WORKDIR /app

# Copy the jar file
COPY target/*.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["java", "-jar", "app.jar"]