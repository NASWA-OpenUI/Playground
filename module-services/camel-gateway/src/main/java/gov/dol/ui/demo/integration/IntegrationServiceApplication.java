package gov.dol.ui.demo.integration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Apache Camel Unified Gateway Application
 * 
 * This is the main Spring Boot application that serves as both:
 * 1. API Gateway - Routes all external traffic to appropriate services
 * 2. Integration Service - Handles protocol conversion and data transformation
 * 
 * Combines the functionality that would traditionally be split between
 * Traefik (API Gateway) and a separate integration service.
 */
@SpringBootApplication
public class IntegrationServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(IntegrationServiceApplication.class, args);
    }
}