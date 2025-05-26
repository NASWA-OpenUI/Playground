package com.playground.camel.routes;

import org.apache.camel.builder.RouteBuilder;
import org.springframework.stereotype.Component;

@Component
public class PaymentServiceRoutes extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        
        // gRPC Server Configuration - listens on port 9090
        // The service will be exposed at grpc://0.0.0.0:9090/payment.PaymentService
        
        // 1. RegisterService - Payment service registration
        from("grpc://0.0.0.0:9090/payment.PaymentService/RegisterService?synchronous=true")
            .routeId("grpc-register-service")
            .log("🚀 gRPC: RegisterService called for ${body.serviceId}")
            .process(exchange -> {
                // Extract the request (Camel automatically deserializes the protobuf)
                var request = exchange.getIn().getBody();
                log.info("Received registration request: {}", request);
                
                // Call the existing service registration logic
                exchange.getIn().setHeader("serviceId", extractField(request, "serviceId"));
                exchange.getIn().setHeader("name", extractField(request, "name"));
                exchange.getIn().setHeader("technology", extractField(request, "technology"));
                exchange.getIn().setHeader("protocol", extractField(request, "protocol"));
                exchange.getIn().setHeader("endpoint", extractField(request, "endpoint"));
                exchange.getIn().setHeader("healthEndpoint", extractField(request, "healthEndpoint"));
            })
            .doTry()
                // Use existing service registration logic
                .bean("serviceRegistrationService", "registerService(${header.serviceId}, ${header.name}, ${header.technology}, ${header.protocol}, ${header.endpoint}, ${header.healthEndpoint})")
                .log("✅ gRPC: Service registered successfully: ${header.serviceId}")
                
                // Build success response
                .process(exchange -> {
                    // Create response using the generated protobuf classes
                    var responseBuilder = createResponseBuilder("payment.RegisterResponse")
                            .setField("success", true)
                            .setField("message", "Service " + exchange.getIn().getHeader("serviceId") + " registered successfully");
                    exchange.getIn().setBody(responseBuilder.build());
                })
                
            .doCatch(Exception.class)
                .log("❌ gRPC: Registration failed: ${exception.message}")
                .process(exchange -> {
                    var responseBuilder = createResponseBuilder("payment.RegisterResponse")
                            .setField("success", false)
                            .setField("message", "Registration failed: " + exchange.getProperty("CamelExceptionCaught", Exception.class).getMessage());
                    exchange.getIn().setBody(responseBuilder.build());
                })
            .end();

        // 2. SendHeartbeat - Heartbeat from payment service
        from("grpc://0.0.0.0:9090/payment.PaymentService/SendHeartbeat?synchronous=true")
            .routeId("grpc-send-heartbeat")
            .log("💓 gRPC: Heartbeat received from ${body.serviceId}")
            .process(exchange -> {
                var request = exchange.getIn().getBody();
                exchange.getIn().setHeader("serviceId", extractField(request, "serviceId"));
                exchange.getIn().setHeader("status", extractField(request, "status"));
            })
            .doTry()
                // Update heartbeat using existing service
                .bean("serviceRegistrationService", "updateHeartbeat(${header.serviceId}, ${header.status})")
                .log("✅ gRPC: Heartbeat updated for ${header.serviceId}")
                
                .process(exchange -> {
                    var responseBuilder = createResponseBuilder("payment.HeartbeatResponse")
                            .setField("success", true)
                            .setField("message", "Heartbeat acknowledged");
                    exchange.getIn().setBody(responseBuilder.build());
                })
                
            .doCatch(Exception.class)
                .log("❌ gRPC: Heartbeat failed: ${exception.message}")
                .process(exchange -> {
                    var responseBuilder = createResponseBuilder("payment.HeartbeatResponse")
                            .setField("success", false)
                            .setField("message", "Heartbeat failed: " + exchange.getProperty("CamelExceptionCaught", Exception.class).getMessage());
                    exchange.getIn().setBody(responseBuilder.build());
                })
            .end();

        // 3. GetClaimsByStatus - Query claims by status
        from("grpc://0.0.0.0:9090/payment.PaymentService/GetClaimsByStatus?synchronous=true")
            .routeId("grpc-get-claims-by-status")
            .log("📋 gRPC: GetClaimsByStatus called for status: ${body.status}")
            .process(exchange -> {
                var request = exchange.getIn().getBody();
                String status = extractField(request, "status").toString();
                exchange.getIn().setHeader("statusCode", status);
            })
            .doTry()
                // Use existing claim service to get claims
                .to("direct:getClaimsByStatus")
                .log("✅ gRPC: Found claims for status ${header.statusCode}")
                
                .process(exchange -> {
                    // Convert JSON response to protobuf Claims
                    String jsonClaims = exchange.getIn().getBody(String.class);
                    var claims = convertJsonToPbClaims(jsonClaims);
                    
                    var responseBuilder = createResponseBuilder("payment.ClaimsResponse")
                            .setField("claims", claims)
                            .setField("success", true)
                            .setField("message", "Found " + claims.size() + " claims with status " + exchange.getIn().getHeader("statusCode"));
                    
                    exchange.getIn().setBody(responseBuilder.build());
                })
                
            .doCatch(Exception.class)
                .log("❌ gRPC: GetClaimsByStatus failed: ${exception.message}")
                .process(exchange -> {
                    var responseBuilder = createResponseBuilder("payment.ClaimsResponse")
                            .setField("success", false)
                            .setField("message", "Failed to get claims: " + exchange.getProperty("CamelExceptionCaught", Exception.class).getMessage());
                    exchange.getIn().setBody(responseBuilder.build());
                })
            .end();

        // 4. UpdateClaimPayment - Update claim with payment info
        from("grpc://0.0.0.0:9090/payment.PaymentService/UpdateClaimPayment?synchronous=true")
            .routeId("grpc-update-claim-payment")
            .log("💰 gRPC: UpdateClaimPayment called for claim ${body.claimId}")
            .process(exchange -> {
                var request = exchange.getIn().getBody();
                exchange.getIn().setHeader("claimReferenceId", extractField(request, "claimId"));
                exchange.getIn().setHeader("statusCode", extractField(request, "status"));
                exchange.getIn().setHeader("statusDisplayName", "Payment Processed");
                exchange.getIn().setHeader("updatedBy", extractField(request, "updatedBy"));
                
                // Build payment notes with amounts
                String notes = String.format("Payment processed via gRPC. WBA: $%.2f, Max Benefit: $%.2f, First Payment: $%.2f. %s",
                    extractField(request, "weeklyBenefitAmount"),
                    extractField(request, "maximumBenefit"), 
                    extractField(request, "firstPaymentAmount"),
                    extractField(request, "notes"));
                exchange.getIn().setHeader("notes", notes);
            })
            .doTry()
                // Use existing claim update logic
                .to("direct:updateClaimStatus")
                .log("✅ gRPC: Payment update successful for claim ${header.claimReferenceId}")
                
                .process(exchange -> {
                    var responseBuilder = createResponseBuilder("payment.PaymentUpdateResponse")
                            .setField("success", true)
                            .setField("message", "Payment updated successfully for claim " + exchange.getIn().getHeader("claimReferenceId"));
                    exchange.getIn().setBody(responseBuilder.build());
                })
                
            .doCatch(Exception.class)
                .log("❌ gRPC: UpdateClaimPayment failed: ${exception.message}")
                .process(exchange -> {
                    var responseBuilder = createResponseBuilder("payment.PaymentUpdateResponse")
                            .setField("success", false)
                            .setField("message", "Payment update failed: " + exchange.getProperty("CamelExceptionCaught", Exception.class).getMessage());
                    exchange.getIn().setBody(responseBuilder.build());
                })
            .end();
    }

    // Helper methods for protobuf handling
    private Object extractField(Object message, String fieldName) {
        // Use reflection or direct method calls to extract fields from protobuf message
        try {
            var method = message.getClass().getMethod("get" + capitalize(fieldName));
            return method.invoke(message);
        } catch (Exception e) {
            log.warn("Failed to extract field {} from message: {}", fieldName, e.getMessage());
            return "";
        }
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }

    private Object createResponseBuilder(String messageType) {
        // This will use the generated protobuf classes
        try {
            String builderClassName = messageType.replace("payment.", "payment.") + "$Builder";
            Class<?> messageClass = Class.forName(builderClassName);
            var newBuilderMethod = messageClass.getEnclosingClass().getMethod("newBuilder");
            return newBuilderMethod.invoke(null);
        } catch (Exception e) {
            log.error("Failed to create response builder for {}: {}", messageType, e.getMessage());
            throw new RuntimeException("Failed to create protobuf response", e);
        }
    }

    private java.util.List<Object> convertJsonToPbClaims(String jsonClaims) {
        // Convert JSON claims to protobuf Claim objects
        // This is a simplified version - you might want to use Jackson for proper JSON parsing
        return java.util.Collections.emptyList(); // Placeholder for now
    }
}