package com.playground.camel.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_registrations")
public class ServiceRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String serviceId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String technology;

    @Column(nullable = false)
    private String protocol;

    @Column(nullable = false)
    private String endpoint;

    @Column
    private String healthEndpoint;

    @Column(nullable = false)
    private String status = "UP";

    @Column
    private String lastMessage;

    @Column(name = "registration_date")
    private LocalDateTime registrationDate = LocalDateTime.now();

    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat = LocalDateTime.now();

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated = LocalDateTime.now();

    // Constructors
    public ServiceRegistration() {}

    public ServiceRegistration(String serviceId, String name, String technology, String protocol, String endpoint) {
        this.serviceId = serviceId;
        this.name = name;
        this.technology = technology;
        this.protocol = protocol;
        this.endpoint = endpoint;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTechnology() {
        return technology;
    }

    public void setTechnology(String technology) {
        this.technology = technology;
    }

    public String getProtocol() {
        return protocol;
    }

    public void setProtocol(String protocol) {
        this.protocol = protocol;
    }

    public String getEndpoint() {
        return endpoint;
    }

    public void setEndpoint(String endpoint) {
        this.endpoint = endpoint;
    }

    public String getHealthEndpoint() {
        return healthEndpoint;
    }

    public void setHealthEndpoint(String healthEndpoint) {
        this.healthEndpoint = healthEndpoint;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        this.lastUpdated = LocalDateTime.now();
    }

    public String getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(String lastMessage) {
        this.lastMessage = lastMessage;
    }

    public LocalDateTime getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(LocalDateTime registrationDate) {
        this.registrationDate = registrationDate;
    }

    public LocalDateTime getLastHeartbeat() {
        return lastHeartbeat;
    }

    public void setLastHeartbeat(LocalDateTime lastHeartbeat) {
        this.lastHeartbeat = lastHeartbeat;
        this.lastUpdated = LocalDateTime.now();
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    // Helper methods
    public void updateHeartbeat() {
        this.lastHeartbeat = LocalDateTime.now();
        this.lastUpdated = LocalDateTime.now();
        this.status = "UP";
    }

    public void markAsDown(String reason) {
        this.status = "DOWN";
        this.lastMessage = reason;
        this.lastUpdated = LocalDateTime.now();
    }

    public boolean isHealthy() {
        return "UP".equals(this.status);
    }
}