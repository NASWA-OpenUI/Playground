package com.playground.camel.monitoring;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.playground.camel.model.ServiceRegistration;
import com.playground.camel.service.ServiceRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component("healthMonitor")
public class HealthMonitor {

    @Autowired
    private ServiceRegistrationService serviceRegistrationService;
    
    private final ObjectMapper objectMapper;

    // Inject Spring's auto-configured ObjectMapper
    public HealthMonitor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void checkAllServices() {
        // Mark stale services as down based on heartbeat timing
        serviceRegistrationService.markStaleServicesAsDown();
    }

    public String getCurrentStatus() throws Exception {
        Map<String, Object> status = new HashMap<>();
        status.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        status.put("camelStatus", "RUNNING");
        status.put("activeConnections", serviceRegistrationService.countActiveServices());
        
        // Get all registered services
        List<ServiceRegistration> registrations = serviceRegistrationService.getAllServices();
        Map<String, ServiceStatus> services = new HashMap<>();
        
        for (ServiceRegistration reg : registrations) {
            ServiceStatus serviceStatus = new ServiceStatus(
                reg.getServiceId(),
                reg.getName(),
                reg.getTechnology(),
                reg.getProtocol(),
                reg.getEndpoint(),
                mapHealthStatus(reg.getStatus()),
                reg.getLastMessage() != null ? reg.getLastMessage() : "Service registered"
            );
            serviceStatus.setLastChecked(reg.getLastHeartbeat());
            services.put(reg.getServiceId(), serviceStatus);
        }
        
        status.put("services", services);

        // Now this will use Spring's configured ObjectMapper with LocalDateTime support
        return objectMapper.writeValueAsString(status);
    }

    private ServiceHealth mapHealthStatus(String status) {
        switch (status.toUpperCase()) {
            case "UP": return ServiceHealth.UP;
            case "DOWN": return ServiceHealth.DOWN;
            default: return ServiceHealth.UNKNOWN;
        }
    }

    public void registerService(String serviceId, String name, String technology, String protocol, String endpoint) {
        // This method is now handled by ServiceRegistrationService
        serviceRegistrationService.registerService(serviceId, name, technology, protocol, endpoint, null);
    }

    // Nested class for service status (for compatibility with existing dashboard)
    public static class ServiceStatus {
        private String id;
        private String name;
        private String technology;
        private String protocol;
        private String endpoint;
        private ServiceHealth health;
        private String message;
        private LocalDateTime lastChecked;

        public ServiceStatus(String id, String name, String technology, String protocol, String endpoint, ServiceHealth health, String message) {
            this.id = id;
            this.name = name;
            this.technology = technology;
            this.protocol = protocol;
            this.endpoint = endpoint;
            this.health = health;
            this.message = message;
            this.lastChecked = LocalDateTime.now();
        }

        // Getters and setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getTechnology() { return technology; }
        public void setTechnology(String technology) { this.technology = technology; }

        public String getProtocol() { return protocol; }
        public void setProtocol(String protocol) { this.protocol = protocol; }

        public String getEndpoint() { return endpoint; }
        public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

        public ServiceHealth getHealth() { return health; }
        public void setHealth(ServiceHealth health) { this.health = health; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public LocalDateTime getLastChecked() { return lastChecked; }
        public void setLastChecked(LocalDateTime lastChecked) { this.lastChecked = lastChecked; }
    }

    public enum ServiceHealth {
        UP, DOWN, UNKNOWN, NOT_CONFIGURED
    }
}