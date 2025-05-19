package com.playground.camel.controller;

import com.playground.camel.monitoring.HealthMonitor;
import org.apache.camel.CamelContext;
import org.apache.camel.ProducerTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
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
}
