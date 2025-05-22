package com.playground.camel.service;

import com.playground.camel.model.ServiceRegistration;
import com.playground.camel.repository.ServiceRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ServiceRegistrationService {

    @Autowired
    private ServiceRegistrationRepository repository;

    public ServiceRegistration registerService(String serviceId, String name, String technology, 
                                             String protocol, String endpoint, String healthEndpoint) {
        
        // Check if service already exists
        Optional<ServiceRegistration> existing = repository.findByServiceId(serviceId);
        
        if (existing.isPresent()) {
            // Update existing registration
            ServiceRegistration service = existing.get();
            service.setName(name);
            service.setTechnology(technology);
            service.setProtocol(protocol);
            service.setEndpoint(endpoint);
            service.setHealthEndpoint(healthEndpoint);
            service.setStatus("UP");
            service.setLastMessage("Service re-registered");
            service.updateHeartbeat();
            
            return repository.save(service);
        } else {
            // Create new registration
            ServiceRegistration newService = new ServiceRegistration(serviceId, name, technology, protocol, endpoint);
            newService.setHealthEndpoint(healthEndpoint);
            newService.setLastMessage("Service registered");
            
            return repository.save(newService);
        }
    }

    public boolean updateHeartbeat(String serviceId, String status) {
        Optional<ServiceRegistration> service = repository.findByServiceId(serviceId);
        
        if (service.isPresent()) {
            ServiceRegistration reg = service.get();
            reg.updateHeartbeat();
            reg.setStatus(status);
            reg.setLastMessage("Heartbeat received");
            repository.save(reg);
            return true;
        }
        
        return false;
    }

    public List<ServiceRegistration> getAllServices() {
        return repository.findAll();
    }

    public Optional<ServiceRegistration> getService(String serviceId) {
        return repository.findByServiceId(serviceId);
    }

    public boolean unregisterService(String serviceId) {
        Optional<ServiceRegistration> service = repository.findByServiceId(serviceId);
        
        if (service.isPresent()) {
            repository.delete(service.get());
            return true;
        }
        
        return false;
    }

    public List<ServiceRegistration> getActiveServices() {
        return repository.findByStatus("UP");
    }

    public long countActiveServices() {
        return repository.countActiveServices();
    }

    public void markStaleServicesAsDown() {
        // Mark services as down if no heartbeat in last 2 minutes
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(2);
        List<ServiceRegistration> staleServices = repository.findStaleServices(cutoffTime);
        
        for (ServiceRegistration service : staleServices) {
            if ("UP".equals(service.getStatus())) {
                service.markAsDown("No heartbeat received");
                repository.save(service);
            }
        }
    }
}