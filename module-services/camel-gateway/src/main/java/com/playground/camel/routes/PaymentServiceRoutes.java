package com.playground.camel.routes;

import org.apache.camel.builder.RouteBuilder;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.HashMap;

@Component  
public class PaymentServiceRoutes extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        
        // gRPC Server Configuration - listens on port 9090
        // Camel will handle protobuf serialization/deserialization automatically
        
        // 1. RegisterService - Payment service registration
        from("grpc://0.0.0.0:9090/payment.PaymentService/RegisterService?synchronous=true")
            .routeId("grpc-register-service")
            .log("🚀 gRPC: RegisterService called - Body: ${body}")
            .process(exchange -> {
                // Camel should provide the request as a Map or similar structure
                Object request = exchange.getIn().getBody();
                log.info("Received registration request: {}", request);
                
                // For now, create a simple success response
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Service registration received via gRPC");
                
                exchange.getIn().setBody(response);
            });

        // ... (other routes with same pattern)
    }
}
