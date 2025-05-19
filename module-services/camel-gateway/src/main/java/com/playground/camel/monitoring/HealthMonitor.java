package com.playground.camel.monitoring;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component("healthMonitor")
public class HealthMonitor {

    private final Map<String, ServiceStatus> serviceStatuses = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    // Inject Spring's auto-configured ObjectMapper
    public HealthMonitor(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        // Initialize with placeholder services that we'll connect to later
        initializePlaceholderServices();
    }

    private void initializePlaceholderServices() {
        // Submit Service (to be added later)
        ServiceStatus submitService = new ServiceStatus(
            "submit-service",
            "Submit Service",
            "Node.js",
            "GraphQL/JSON",
            "http://submit-service:3000",
            ServiceHealth.NOT_CONFIGURED,
            "Service not configured yet"
        );
        serviceStatuses.put("submit-service", submitService);

        // Receive Service (to be added later)
        ServiceStatus receiveService = new ServiceStatus(
            "receive-service", 
            "Receive Service",
            "Java/Spring",
            "REST/XML",
            "http://receive-service:8082",
            ServiceHealth.NOT_CONFIGURED,
            "Service not configured yet"
        );
        serviceStatuses.put("receive-service", receiveService);
    }

    public void checkAllServices() {
        for (ServiceStatus service : serviceStatuses.values()) {
            checkServiceHealth(service);
        }
    }

    private void checkServiceHealth(ServiceStatus service) {
        // Only check services that are configured
        if (service.getHealth() == ServiceHealth.NOT_CONFIGURED) {
            return;
        }

        try {
            // TODO: Implement actual health check calls
            // For now, just update the timestamp
            service.setLastChecked(LocalDateTime.now());
            service.setHealth(ServiceHealth.UNKNOWN);
            service.setMessage("Health check not yet implemented");
        } catch (Exception e) {
            service.setHealth(ServiceHealth.DOWN);
            service.setMessage("Health check failed: " + e.getMessage());
            service.setLastChecked(LocalDateTime.now());
        }
    }

    public String getCurrentStatus() throws Exception {
        Map<String, Object> status = new HashMap<>();
        status.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        status.put("camelStatus", "RUNNING");
        status.put("activeConnections", countActiveConnections());
        status.put("services", serviceStatuses);

        // Now this will use Spring's configured ObjectMapper with LocalDateTime support
        return objectMapper.writeValueAsString(status);
    }

    private int countActiveConnections() {
        return (int) serviceStatuses.values().stream()
            .filter(service -> service.getHealth() == ServiceHealth.UP)
            .count();
    }

    public void registerService(String serviceId, String name, String technology, String protocol, String endpoint) {
        ServiceStatus service = new ServiceStatus(serviceId, name, technology, protocol, endpoint, ServiceHealth.UP, "Recently registered");
        service.setLastChecked(LocalDateTime.now());
        serviceStatuses.put(serviceId, service);
    }

    // Nested class for service status
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
