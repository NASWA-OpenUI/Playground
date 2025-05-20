package com.playground.camel.repository;

import com.playground.camel.model.InterfaceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterfaceConfigRepository extends JpaRepository<InterfaceConfig, Long> {
    
    Optional<InterfaceConfig> findByName(String name);
    
    List<InterfaceConfig> findByProtocol(String protocol);
    
    List<InterfaceConfig> findByActive(boolean active);
}
