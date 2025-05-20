package com.playground.camel.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.playground.camel.model.InterfaceConfig;
import org.apache.camel.CamelContext;
import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.RouteDefinition;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import jakarta.annotation.PostConstruct;

@Service
public class DynamicRouteService {

    @Autowired
    private CamelContext camelContext;
    
    @Autowired
    private InterfaceConfigService configService;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Keep track of active route IDs
    private final Map<Long, String> activeRoutes = new ConcurrentHashMap<>();

    @PostConstruct
    public void initRoutes() {
        // Initialize routes for active interfaces on startup
        configService.getActiveInterfaces().forEach(this::createOrUpdateRoute);
    }

    public void createOrUpdateRoute(InterfaceConfig config) {
        if (!config.isActive()) {
            // If the interface is marked as inactive, remove the route if it exists
            removeRoute(config.getId());
            return;
        }

        // Generate a unique route ID for this interface
        String routeId = "interface-" + config.getId();
        
        try {
            // Remove existing route if it exists
            if (activeRoutes.containsKey(config.getId())) {
                removeRoute(config.getId());
            }
            
            // Create a new route based on the interface protocol
            camelContext.addRoutes(createRouteForInterface(config, routeId));
            
            // Track the active route
            activeRoutes.put(config.getId(), routeId);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to create route for interface: " + config.getName(), e);
        }
    }
    
    public void removeRoute(Long interfaceId) {
        String routeId = activeRoutes.get(interfaceId);
        if (routeId != null) {
            try {
                camelContext.getRouteController().stopRoute(routeId);
                camelContext.removeRoute(routeId);
                activeRoutes.remove(interfaceId);
            } catch (Exception e) {
                throw new RuntimeException("Failed to remove route: " + routeId, e);
            }
        }
    }
    
    private RouteBuilder createRouteForInterface(InterfaceConfig config, String routeId) {
        return new RouteBuilder() {
            @Override
            public void configure() throws Exception {
                String protocol = config.getProtocol();
                
                // Create route based on protocol
                switch (protocol.toUpperCa
