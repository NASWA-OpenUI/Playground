package com.playground.camel.controller;

import com.playground.camel.monitoring.HealthMonitor;
import com.playground.camel.model.ServiceRegistration;
import com.playground.camel.service.ServiceRegistrationService;
import org.apache.camel.CamelContext;
import org.apache.camel.ProducerTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class IntegrationController {

    @Autowired
    private CamelContext camelContext;

    @Autowired
    private ProducerTemplate producerTemplate;

    @Autowired
    private HealthMonitor healthMonitor;

    @Autowired
    private ServiceRegistrationService serviceRegistrationService;

    @PostMapping(value = "/submit", 
                consumes = MediaType.APPLICATION_JSON_VALUE,
                produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> submitData(@RequestBody String jsonData) {
        try {
            // Send the request to our Camel route for processing
            String result = producerTemplate.requestBody("direct:processSubmission", jsonData, String.class);
            
            // Return a proper Map object instead of manual JSON string
            Map<String, Object> response = new HashMap<>();
            response.put("status", "success");
            response.put("result", result);
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
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
        try {
            // Get the current service status directly from HealthMonitor
            String status = healthMonitor.getCurrentStatus();
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            e.printStackTrace(); // This will show in the logs
            
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
            e.printStackTrace(); // This will show in the logs
            
            // Return a proper Map object for errors
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Camel health check failed");
            errorResponse.put("message", e.getMessage());
            errorResponse.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // NEW: Service registration endpoints (moved here from separate controller for simplicity)
    @PostMapping(value = "/services/register", 
                consumes = MediaType.APPLICATION_JSON_VALUE,
                produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> registerService(@RequestBody Map<String, Object> registrationData) {
        try {
            String serviceId = (String) registrationData.get("serviceId");
            String name = (String) registrationData.get("name");
            String technology = (String) registrationData.get("technology");
            String protocol = (String) registrationData.get("protocol");
            String endpoint = (String) registrationData.get("endpoint");
            String healthEndpoint = (String) registrationData.get("healthEndpoint");

            System.out.println("📝 Received service registration: " + serviceId);

            // Validate required fields
            if (serviceId == null || name == null || technology == null || protocol == null || endpoint == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "Missing required fields: serviceId, name, technology, protocol, endpoint");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            ServiceRegistration registration = serviceRegistrationService.registerService(
                serviceId, name, technology, protocol, endpoint, healthEndpoint
            );

            System.out.println("✅ Service registered successfully: " + serviceId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Service registered successfully");
            response.put("serviceId", registration.getServiceId());
            response.put("registrationDate", registration.getRegistrationDate());
            response.put("status", registration.getStatus());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("❌ Service registration failed: " + e.getMessage());
            e.printStackTrace();
            
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
        try {
            String serviceId = (String) heartbeatData.get("serviceId");
            String status = (String) heartbeatData.getOrDefault("status", "UP");

            System.out.println("💓 Received heartbeat from: " + serviceId);

            if (serviceId == null) {
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
                System.err.println("⚠️ Heartbeat for unknown service: " + serviceId);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Heartbeat processing failed: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Heartbeat processing failed: " + e.getMessage());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping(value = "/services", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<ServiceRegistration>> getAllServices() {
        try {
            List<ServiceRegistration> services = serviceRegistrationService.getAllServices();
            return ResponseEntity.ok(services);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}