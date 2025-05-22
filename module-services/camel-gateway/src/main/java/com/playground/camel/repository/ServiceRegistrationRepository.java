package com.playground.camel.repository;

import com.playground.camel.model.ServiceRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRegistrationRepository extends JpaRepository<ServiceRegistration, Long> {
    
    Optional<ServiceRegistration> findByServiceId(String serviceId);
    
    List<ServiceRegistration> findByStatus(String status);
    
    List<ServiceRegistration> findByProtocol(String protocol);
    
    @Query("SELECT s FROM ServiceRegistration s WHERE s.lastHeartbeat < :cutoffTime")
    List<ServiceRegistration> findStaleServices(LocalDateTime cutoffTime);
    
    @Query("SELECT COUNT(s) FROM ServiceRegistration s WHERE s.status = 'UP'")
    long countActiveServices();
}