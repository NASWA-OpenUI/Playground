package com.playground.camel.controller;

import com.playground.camel.monitoring.HealthMonitor;
import org.apache.camel.CamelContext;
import org.apache.camel.ProducerTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<String> submitData(@RequestBody String jsonData) {
        try {
            // Send the request to our Camel route for processing
            String result = producerTemplate.requestBody("direct:processSubmission", jsonData, String.class);
            
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(result);
        } catch (Exception e) {
            String errorResponse = String.format(
                "{\"error\": \"Processing failed\", \"message\": \"%s\", \"timestamp\": \"%s\"}", 
                e.getMessage(), 
                java.time.LocalDateTime.now().toString()
            );
            return ResponseEntity.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .body(errorResponse);
        }
    }

    @GetMapping(value = "/health/services", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getServiceHealth() {
        try {
            // Get the current service status directly from HealthMonitor (no Camel route)
            String status = healthMonitor.getCurrentStatus();
            
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(status);
        } catch (Exception e) {
            e.printStackTrace(); // This will show in the logs
            String errorResponse = String.format(
                "{\"error\": \"Health check failed\", \"message\": \"%s\", \"timestamp\": \"%s\"}", 
                e.getMessage(), 
                java.time.LocalDateTime.now().toString()
            );
            return ResponseEntity.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .body(errorResponse);
        }
    }

    @GetMapping(value = "/health/camel", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getCamelHealth() {
        try {
            boolean isStarted = camelContext.getStatus().isStarted();
            int routeCount = camelContext.getRoutes().size();
            
            String healthInfo = String.format(
                "{\"status\": \"%s\", \"routeCount\": %d, \"uptime\": \"%s\", \"timestamp\": \"%s\"}", 
                isStarted ? "UP" : "DOWN",
                routeCount,
                camelContext.getUptime(),
                java.time.LocalDateTime.now().toString()
            );
            
            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(healthInfo);
        } catch (Exception e) {
            e.printStackTrace(); // This will show in the logs
            String errorResponse = String.format(
                "{\"error\": \"Camel health check failed\", \"message\": \"%s\", \"timestamp\": \"%s\"}", 
                e.getMessage(), 
                java.time.LocalDateTime.now().toString()
            );
            return ResponseEntity.status(500)
                .contentType(MediaType.APPLICATION_JSON)
                .body(errorResponse);
        }
    }
}
