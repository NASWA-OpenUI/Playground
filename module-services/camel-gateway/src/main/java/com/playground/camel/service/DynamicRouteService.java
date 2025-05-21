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
                switch (protocol.toUpperCase()) {
                    case "REST":
                        configureRestRoute(config, routeId);
                        break;
                    case "SOAP":
                        configureSoapRoute(config, routeId);
                        break;
                    case "GRAPHQL":
                        configureGraphQLRoute(config, routeId);
                        break;
                    case "GRPC":
                        configureGrpcRoute(config, routeId);
                        break;
                    default:
                        throw new IllegalArgumentException("Unsupported protocol: " + protocol);
                }
            }
            
            private void configureRestRoute(InterfaceConfig config, String routeId) {
                // Parse template JSON for configuration details
                Map<String, Object> templateConfig = parseTemplate(config.getTemplate());
                String path = (String) templateConfig.getOrDefault("path", config.getEndpoint());
    
                // Create a basic REST endpoint with common HTTP methods
                rest(path)
                    .id(routeId)
                    .consumes("application/json")
                    .produces("application/json")
                    .get().to("direct:processApiRequest")
                    .post().to("direct:processApiRequest")
                    .put().to("direct:processApiRequest")
                    .delete().to("direct:processApiRequest");
                
                // Add a processing route that logs and echoes the data
                from("direct:processApiRequest")
                    .routeId(routeId + "-processor")
                    .log("Received request on interface: " + config.getName())
                    .transform().simple("{ \"status\": \"success\", \"message\": \"Request received on interface: " + config.getName() + "\", \"endpoint\": \"" + config.getEndpoint() + "\" }");
            }
            
            private void configureSoapRoute(InterfaceConfig config, String routeId) {
                // Basic SOAP endpoint - in a real implementation we would use the template for more configuration
                from("spring-ws:rootqname:{http://example.org/}request?endpointMapping=#wsEndpointMapping")
                    .routeId(routeId)
                    .log("Received SOAP request on interface: " + config.getName())
                    .transform().simple("<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n" +
                        "  <soap:Body>\n" +
                        "    <response xmlns=\"http://example.org/\">\n" +
                        "      <status>success</status>\n" +
                        "      <message>Request received on SOAP interface: " + config.getName() + "</message>\n" +
                        "    </response>\n" +
                        "  </soap:Body>\n" +
                        "</soap:Envelope>");
            }
            
            private void configureGraphQLRoute(InterfaceConfig config, String routeId) {
                // Parse template JSON for configuration details
                Map<String, Object> templateConfig = parseTemplate(config.getTemplate());
    
                // Get configuration values with defaults
                String path = (String) templateConfig.getOrDefault("path", config.getEndpoint());
                String targetUrl = (String) templateConfig.getOrDefault("targetUrl", "http://claimant-services:3000/graphql");
    
                // Log configuration
                log.info("Configuring GraphQL route: {} with target: {}", routeId, targetUrl);
    
                // Define the REST endpoint that will handle GraphQL requests
                rest(path)
                    .id(routeId)
                    .post()
                    .consumes("application/json")
                    .produces("application/json")
                    .to("direct:" + routeId + "-processor");
    
                // Define the processing route for GraphQL requests
                from("direct:" + routeId + "-processor")
                    .routeId(routeId + "-processor")
                    .log("Received GraphQL request on interface: " + config.getName())
                    .removeHeaders("CamelHttp*") // Remove any existing HTTP headers
                    .setHeader(Exchange.HTTP_METHOD, constant("POST"))
                    .setHeader(Exchange.CONTENT_TYPE, constant("application/json"))
                    .setHeader("Accept", constant("application/json"))
        
                       // Forward the request to the target GraphQL endpoint
                        .toD(targetUrl)
                        .log("GraphQL response received from " + targetUrl);
            }        
            
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseTemplate(String template) {
        try {
            return objectMapper.readValue(template, HashMap.class);
        } catch (Exception e) {
            // Return empty map if template can't be parsed
            return new HashMap<>();
				}
			}
		}
	}
};
