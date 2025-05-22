package com.playground.camel.controller;

import com.playground.camel.model.ServiceRegistration;
import com.playground.camel.service.ServiceRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "*")
public class ServiceRegistrationController {

    @Autowired
    private ServiceRegistrationService serviceRegistrationService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> registerService(@RequestBody Map<String, Object> registrationData) {
        try {
            String serviceId = (String) registrationData.get("serviceId");
            String name = (String) registrationData.get("name");
            String technology = (String) registrationData.get("technology");
            String protocol = (String) registrationData.get("protocol");
            String endpoint = (String) registrationData.get("endpoint");
            String healthEndpoint = (String) registrationData.get("healthEndpoint");

            // Validate required fields
            if (serviceId == null || name == null || technology == null || protocol == null || endpoint == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Missing required fields: serviceId, name, technology, protocol, endpoint"
                ));
            }

            ServiceRegistration registration = serviceRegistrationService.registerService(
                serviceId, name, technology, protocol, endpoint, healthEndpoint
            );

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Service registered successfully",
                "serviceId", registration.getServiceId(),
                "registrationDate", registration.getRegistrationDate(),
                "status", registration.getStatus()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "error", "Registration failed: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Map<String, Object>> receiveHeartbeat(@RequestBody Map<String, Object> heartbeatData) {
        try {
            String serviceId = (String) heartbeatData.get("serviceId");
            String status = (String) heartbeatData.getOrDefault("status", "UP");

            if (serviceId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Missing serviceId in heartbeat"
                ));
            }

            boolean updated = serviceRegistrationService.updateHeartbeat(serviceId, status);

            if (updated) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Heartbeat received",
                    "serviceId", serviceId,
                    "timestamp", LocalDateTime.now()
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "error", "Heartbeat processing failed: " + e.getMessage()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<ServiceRegistration>> getAllServices() {
        try {
            List<ServiceRegistration> services = serviceRegistrationService.getAllServices();
            return ResponseEntity.ok(services);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{serviceId}")
    public ResponseEntity<ServiceRegistration> getService(@PathVariable String serviceId) {
        try {
            return serviceRegistrationService.getService(serviceId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{serviceId}")
    public ResponseEntity<Map<String, Object>> unregisterService(@PathVariable String serviceId) {
        try {
            boolean removed = serviceRegistrationService.unregisterService(serviceId);
            
            if (removed) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Service unregistered successfully",
                    "serviceId", serviceId
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "error", "Unregistration failed: " + e.getMessage()
            ));
        }
    }
}