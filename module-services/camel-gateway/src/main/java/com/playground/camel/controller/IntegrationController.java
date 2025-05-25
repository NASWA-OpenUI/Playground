package com.playground.camel.controller;

import com.playground.camel.monitoring.HealthMonitor;
import com.playground.camel.model.ServiceRegistration;
import com.playground.camel.model.Claim;
import com.playground.camel.service.ServiceRegistrationService;
import com.playground.camel.service.ClaimService;
import org.apache.camel.CamelContext;
import org.apache.camel.ProducerTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class IntegrationController {

    private static final Logger logger = LoggerFactory.getLogger(IntegrationController.class);

    @Autowired
    private CamelContext camelContext;

    @Autowired
    private ProducerTemplate producerTemplate;

    @Autowired
    private HealthMonitor healthMonitor;

    @Autowired
    private ServiceRegistrationService serviceRegistrationService;

    @Autowired
    private ClaimService claimService;

    @PostMapping(value = "/submit", 
                consumes = MediaType.APPLICATION_JSON_VALUE,
                produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> submitData(@RequestBody String jsonData) {
        logger.info("📥 Received submission request");
        try {
            // Send the request to our Camel route for processing
            String result = producerTemplate.requestBody("direct:processSubmission", jsonData, String.class);
            
            // Return a proper Map object instead of manual JSON string
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("result", result);
            response.put("timestamp", LocalDateTime.now());
            
            logger.info("✅ Submission processed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Submission processing failed", e);
            // Return a proper Map object for errors too
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Processing failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping(value = "/health/services", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getServiceHealth() {
        logger.debug("🔍 Health check requested");
        try {
            // Get the current service status directly from HealthMonitor
            String status = healthMonitor.getCurrentStatus();
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            logger.error("❌ Health check failed", e);
            
            // Create error response as Map, then convert to JSON
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Health check failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .body(errorResponse.toString()); // This is temporary - we'll improve this in the next iteration
        }
    }

    @GetMapping(value = "/health/camel", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getCamelHealth() {
        logger.debug("🔍 Camel health check requested");
        try {
            boolean isStarted = camelContext.getStatus().isStarted();
            int routeCount = camelContext.getRoutes().size();
            
            // Return a proper Map object
            Map<String, Object> healthInfo = new HashMap<>();
            healthInfo.put("status", isStarted ? "UP" : "DOWN");
            healthInfo.put("routeCount", routeCount);
            healthInfo.put("uptime", camelContext.getUptime());
            healthInfo.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(healthInfo);
        } catch (Exception e) {
            logger.error("❌ Camel health check failed", e);
            
            // Return a proper Map object for errors
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Camel health check failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // Service registration endpoints
    @PostMapping(value = "/services/register", 
                consumes = MediaType.APPLICATION_JSON_VALUE,
                produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> registerService(@RequestBody Map<String, Object> registrationData) {
        logger.info("📝 Service registration request received");
        logger.info("📝 Registration data: {}", registrationData);
        
        try {
            String serviceId = (String) registrationData.get("serviceId");
            String name = (String) registrationData.get("name");
            String technology = (String) registrationData.get("technology");
            String protocol = (String) registrationData.get("protocol");
            String endpoint = (String) registrationData.get("endpoint");
            String healthEndpoint = (String) registrationData.get("healthEndpoint");

            logger.info("📝 Processing registration for service: {}", serviceId);

            // Validate required fields
            if (serviceId == null || name == null || technology == null || protocol == null || endpoint == null) {
                logger.error("❌ Missing required fields in registration");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Missing required fields: serviceId, name, technology, protocol, endpoint");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            ServiceRegistration registration = serviceRegistrationService.registerService(
                serviceId, name, technology, protocol, endpoint, healthEndpoint
            );

            logger.info("✅ Service registered successfully: {} -> {}", serviceId, registration.getId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Service registered successfully");
            response.put("serviceId", registration.getServiceId());
            response.put("registrationDate", registration.getRegistrationDate());
            response.put("status", registration.getStatus());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Service registration failed", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Registration failed: " + e.getMessage());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping(value = "/services/heartbeat",
                consumes = MediaType.APPLICATION_JSON_VALUE,
                produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> receiveHeartbeat(@RequestBody Map<String, Object> heartbeatData) {
        logger.debug("💓 Heartbeat received: {}", heartbeatData);
        
        try {
            String serviceId = (String) heartbeatData.get("serviceId");
            String status = (String) heartbeatData.getOrDefault("status", "UP");

            if (serviceId == null) {
                logger.error("❌ Missing serviceId in heartbeat");
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Missing serviceId in heartbeat");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            boolean updated = serviceRegistrationService.updateHeartbeat(serviceId, status);

            if (updated) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Heartbeat received");
                response.put("serviceId", serviceId);
                response.put("timestamp", LocalDateTime.now());
                
                return ResponseEntity.ok(response);
            } else {
                logger.warn("⚠️ Heartbeat for unknown service: {}", serviceId);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("❌ Heartbeat processing failed", e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Heartbeat processing failed: " + e.getMessage());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping(value = "/services", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<ServiceRegistration>> getAllServices() {
        logger.debug("🔍 Services list requested");
        try {
            List<ServiceRegistration> services = serviceRegistrationService.getAllServices();
            logger.debug("📋 Returning {} services", services.size());
            return ResponseEntity.ok(services);
        } catch (Exception e) {
            logger.error("❌ Failed to get services list", e);
            return ResponseEntity.status(500).build();
        }
    }

    // NEW CLAIMS ENDPOINTS FOR TAX-SERVICE INTEGRATION
    @GetMapping(value = "/claims/status/{status}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<Claim>> getClaimsByStatus(@PathVariable String status) {
        logger.info("🔍 Claims requested for status: {}", status);
        
        try {
            // Use the existing Camel route that's already defined in IntegrationRoutes.java
            // Set the status as a header and call the direct route
            Map<String, Object> headers = new HashMap<>();
            headers.put("statusCode", status);
            
            // Call the Camel route to get claims by status
            @SuppressWarnings("unchecked")
            List<Claim> claims = (List<Claim>) producerTemplate.requestBodyAndHeaders(
                "direct:getClaimsByStatus", 
                null, 
                headers, 
                List.class
            );
            
            logger.info("📋 Found {} claims with status: {}", claims.size(), status);
            return ResponseEntity.ok(claims);
            
        } catch (Exception e) {
            logger.error("❌ Failed to get claims for status {}: {}", status, e.getMessage(), e);
            
            // Return empty list instead of error to avoid breaking polling services
            logger.info("📋 Returning empty list due to error");
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    @GetMapping(value = "/claims", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<Claim>> getAllClaims() {
        logger.info("🔍 All claims requested");
        
        try {
            List<Claim> claims = claimService.getAllClaims();
            
            logger.info("📋 Found {} total claims", claims.size());
            return ResponseEntity.ok(claims);
            
        } catch (Exception e) {
            logger.error("❌ Failed to get all claims: {}", e.getMessage(), e);
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    // Add a simple test endpoint to verify the controller is working
    @GetMapping(value = "/test", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> testEndpoint() {
        logger.info("🧪 Test endpoint called");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Integration Controller is working");
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }
}