package com.playground.camel.routes;

import org.apache.camel.builder.RouteBuilder;
import org.springframework.stereotype.Component;
import payment.PaymentProto.*;

@Component
public class PaymentServiceRoutes extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        
        // gRPC Server Configuration - listens on port 9090
        
        // 1. RegisterService - Payment service registration
        from("grpc://0.0.0.0:9090/payment.PaymentService/RegisterService?synchronous=true")
            .routeId("grpc-register-service")
            .log("🚀 gRPC: RegisterService called for ${body.serviceId}")
            .process(exchange -> {
                // Extract the request (Camel automatically deserializes the protobuf)
                RegisterRequest request = exchange.getIn().getBody(RegisterRequest.class);
                log.info("Received registration request: {}", request);
                
                // Set headers for existing service registration logic
                exchange.getIn().setHeader("serviceId", request.getServiceId());
                exchange.getIn().setHeader("name", request.getName());
                exchange.getIn().setHeader("technology", request.getTechnology());
                exchange.getIn().setHeader("protocol", request.getProtocol());
                exchange.getIn().setHeader("endpoint", request.getEndpoint());
                exchange.getIn().setHeader("healthEndpoint", request.getHealthEndpoint());
            })
            .doTry()
                // Use existing service registration logic
                .bean("serviceRegistrationService", "registerService(${header.serviceId}, ${header.name}, ${header.technology}, ${header.protocol}, ${header.endpoint}, ${header.healthEndpoint})")
                .log("✅ gRPC: Service registered successfully: ${header.serviceId}")
                
                // Build success response using proper protobuf builder
                .process(exchange -> {
                    RegisterResponse response = RegisterResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage("Service " + exchange.getIn().getHeader("serviceId") + " registered successfully")
                            .build();
                    exchange.getIn().setBody(response);
                })
                
            .doCatch(Exception.class)
                .log("❌ gRPC: Registration failed: ${exception.message}")
                .process(exchange -> {
                    RegisterResponse response = RegisterResponse.newBuilder()
                            .setSuccess(false)
                            .setMessage("Registration failed: " + exchange.getProperty("CamelExceptionCaught", Exception.class).getMessage())
                            .build();
                    exchange.getIn().setBody(response);
                })
            .end();

        // 2. SendHeartbeat - Heartbeat from payment service
        from("grpc://0.0.0.0:9090/payment.PaymentService/SendHeartbeat?synchronous=true")
            .routeId("grpc-send-heartbeat")
            .log("💓 gRPC: Heartbeat received from ${body.serviceId}")
            .process(exchange -> {
                HeartbeatRequest request = exchange.getIn().getBody(HeartbeatRequest.class);
                exchange.getIn().setHeader("serviceId", request.getServiceId());
                exchange.getIn().setHeader("status", request.getStatus());
            })
            .doTry()
                // Update heartbeat using existing service
                .bean("serviceRegistrationService", "updateHeartbeat(${header.serviceId}, ${header.status})")
                .log("✅ gRPC: Heartbeat updated for ${header.serviceId}")
                
                .process(exchange -> {
                    HeartbeatResponse response = HeartbeatResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage("Heartbeat acknowledged")
                            .build();
                    exchange.getIn().setBody(response);
                })
                
            .doCatch(Exception.class)
                .log("❌ gRPC: Heartbeat failed: ${exception.message}")
                .process(exchange -> {
                    HeartbeatResponse response = HeartbeatResponse.newBuilder()
                            .setSuccess(false)
                            .setMessage("Heartbeat failed: " + exchange.getProperty("CamelExceptionCaught", Exception.class).getMessage())
                            .build();
                    exchange.getIn().setBody(response);
                })
            .end();

        // 3. GetClaimsByStatus - Query claims by status
        from("grpc://0.0.0.0:9090/payment.PaymentService/GetClaimsByStatus?synchronous=true")
            .routeId("grpc-get-claims-by-status")
            .log("📋 gRPC: GetClaimsByStatus called for status: ${body.status}")
            .process(exchange -> {
                StatusRequest request = exchange.getIn().getBody(StatusRequest.class);
                String status = request.getStatus();
                exchange.getIn().setHeader("statusCode", status);
            })
            .doTry()
                // Use existing claim service to get claims
                .to("direct:getClaimsByStatus")
                .log("✅ gRPC: Found claims for status ${header.statusCode}")
                
                .process(exchange -> {
                    // For now, return empty claims list - we can enhance this later
                    // The actual claim conversion would require mapping your Claim entities to protobuf Claims
                    ClaimsResponse response = ClaimsResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage("Claims query successful for status " + exchange.getIn().getHeader("statusCode"))
                            .build();
                    
                    exchange.getIn().setBody(response);
                })
                
            .doCatch(Exception.class)
                .log("❌ gRPC: GetClaimsByStatus failed: ${exception.message}")
                .process(exchange -> {
                    ClaimsResponse response = ClaimsResponse.newBuilder()
                            .setSuccess(false)
                            .setMessage("Failed to get claims: " + exchange.getProperty("CamelExceptionCaught", Exception.class).getMessage())
                            .build();
                    exchange.getIn().setBody(response);
                })
            .end();

        // 4. UpdateClaimPayment - Update claim with payment info
        from("grpc://0.0.0.0:9090/payment.PaymentService/UpdateClaimPayment?synchronous=true")
            .routeId("grpc-update-claim-payment")
            .log("💰 gRPC: UpdateClaimPayment called for claim ${body.claimId}")
            .process(exchange -> {
                PaymentUpdateRequest request = exchange.getIn().getBody(PaymentUpdateRequest.class);
                exchange.getIn().setHeader("claimReferenceId", request.getClaimId());
                exchange.getIn().setHeader("statusCode", request.getStatus());
                exchange.getIn().setHeader("statusDisplayName", "Payment Processed");
                exchange.getIn().setHeader("updatedBy", request.getUpdatedBy());
                
                // Build payment notes with amounts
                String notes = String.format("Payment processed via gRPC. WBA: $%.2f, Max Benefit: $%.2f, First Payment: $%.2f. %s",
                    request.getWeeklyBenefitAmount(),
                    request.getMaximumBenefit(), 
                    request.getFirstPaymentAmount(),
                    request.getNotes());
                exchange.getIn().setHeader("notes", notes);
            })
            .doTry()
                // Use existing claim update logic
                .to("direct:updateClaimStatus")
                .log("✅ gRPC: Payment update successful for claim ${header.claimReferenceId}")
                
                .process(exchange -> {
                    PaymentUpdateResponse response = PaymentUpdateResponse.newBuilder()
                            .setSuccess(true)
                            .setMessage("Payment updated successfully for claim " + exchange.getIn().getHeader("claimReferenceId"))
                            .build();
                    exchange.getIn().setBody(response);
                })
                
            .doCatch(Exception.class)
                .log("❌ gRPC: UpdateClaimPayment failed: ${exception.message}")
                .process(exchange -> {
                    PaymentUpdateResponse response = PaymentUpdateResponse.newBuilder()
                            .setSuccess(false)
                            .setMessage("Payment update failed: " + exchange.getProperty("CamelExceptionCaught", Exception.class).getMessage())
                            .build();
                    exchange.getIn().setBody(response);
                })
            .end();
    }
}
