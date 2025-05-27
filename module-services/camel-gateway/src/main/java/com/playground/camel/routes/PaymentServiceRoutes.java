package com.playground.camel.routes;

import org.apache.camel.builder.RouteBuilder;
import org.springframework.stereotype.Component;

@Component
public class PaymentServiceRoutes extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        
        // HTTP-based Payment Service endpoints
        // Following the same patterns as other services in the system
        
        // 1. Service Registration - POST /api/payment/register
        from("rest:post:/api/payment/register")
            .routeId("payment-register-service")
            .log("🚀 HTTP: Payment service registration received: ${body}")
            .process(exchange -> {
                // Extract registration data from JSON body
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> request = exchange.getIn().getBody(java.util.Map.class);
                
                exchange.getIn().setHeader("serviceId", request.get("serviceId"));
                exchange.getIn().setHeader("name", request.get("name"));
                exchange.getIn().setHeader("technology", request.get("technology"));
                exchange.getIn().setHeader("protocol", request.get("protocol"));
                exchange.getIn().setHeader("endpoint", request.get("endpoint"));
                exchange.getIn().setHeader("healthEndpoint", request.get("healthEndpoint"));
            })
            .doTry()
                // Use existing service registration logic
                .bean("serviceRegistrationService", "registerService(${header.serviceId}, ${header.name}, ${header.technology}, ${header.protocol}, ${header.endpoint}, ${header.healthEndpoint})")
                .log("✅ HTTP: Payment service registered successfully: ${header.serviceId}")
                
                // Return success response
                .setBody(constant("{ \"success\": true, \"message\": \"Payment service registered successfully\" }"))
                .setHeader("Content-Type", constant("application/json"))
                
            .doCatch(Exception.class)
                .log("❌ HTTP: Payment registration failed: ${exception.message}")
                .setBody(simple("{ \"success\": false, \"message\": \"Registration failed: ${exception.message}\" }"))
                .setHeader("Content-Type", constant("application/json"))
            .end();

        // 2. Heartbeat - POST /api/payment/heartbeat
        from("rest:post:/api/payment/heartbeat")
            .routeId("payment-heartbeat")
            .log("💓 HTTP: Payment service heartbeat received: ${body}")
            .process(exchange -> {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> request = exchange.getIn().getBody(java.util.Map.class);
                
                exchange.getIn().setHeader("serviceId", request.get("serviceId"));
                exchange.getIn().setHeader("status", request.get("status"));
            })
            .doTry()
                // Update heartbeat using existing service
                .bean("serviceRegistrationService", "updateHeartbeat(${header.serviceId}, ${header.status})")
                .log("✅ HTTP: Payment heartbeat updated for ${header.serviceId}")
                
                .setBody(constant("{ \"success\": true, \"message\": \"Heartbeat acknowledged\" }"))
                .setHeader("Content-Type", constant("application/json"))
                
            .doCatch(Exception.class)
                .log("❌ HTTP: Payment heartbeat failed: ${exception.message}")
                .setBody(simple("{ \"success\": false, \"message\": \"Heartbeat failed: ${exception.message}\" }"))
                .setHeader("Content-Type", constant("application/json"))
            .end();

        // 3. Get Claims by Status - GET /api/payment/claims?status=AWAITING_PAYMENT_PROCESSING
        from("rest:get:/api/payment/claims")
            .routeId("payment-get-claims")
            .log("📋 HTTP: Get claims request - Status: ${header.status}")
            .process(exchange -> {
                String status = exchange.getIn().getHeader("status", String.class);
                if (status == null || status.isEmpty()) {
                    status = "AWAITING_PAYMENT_PROCESSING"; // Default
                }
                exchange.getIn().setHeader("statusCode", status);
            })
            .doTry()
                // Use existing claim service to get claims
                .to("direct:getClaimsByStatus")
                .log("✅ HTTP: Found claims for status ${header.statusCode}")
                
                // Response is already JSON from existing route
                .setHeader("Content-Type", constant("application/json"))
                
            .doCatch(Exception.class)
                .log("❌ HTTP: Get claims failed: ${exception.message}")
                .setBody(simple("{ \"success\": false, \"message\": \"Failed to get claims: ${exception.message}\", \"claims\": [] }"))
                .setHeader("Content-Type", constant("application/json"))
            .end();

        // 4. Update Claim Payment - POST /api/payment/update
        from("rest:post:/api/payment/update")
            .routeId("payment-update-claim")
            .log("💰 HTTP: Payment update received: ${body}")
            .process(exchange -> {
                @SuppressWarnings("unchecked")
                java.util.Map<String, Object> request = exchange.getIn().getBody(java.util.Map.class);
                
                exchange.getIn().setHeader("claimReferenceId", request.get("claimId"));
                exchange.getIn().setHeader("statusCode", request.get("status"));
                exchange.getIn().setHeader("statusDisplayName", "Payment Processed");
                exchange.getIn().setHeader("updatedBy", request.get("updatedBy"));
                
                // Build payment notes with amounts
                String notes = String.format("Payment processed via HTTP. WBA: $%.2f, Max Benefit: $%.2f, First Payment: $%.2f. %s",
                    Double.parseDouble(request.get("weeklyBenefitAmount").toString()),
                    Double.parseDouble(request.get("maximumBenefit").toString()), 
                    Double.parseDouble(request.get("firstPaymentAmount").toString()),
                    request.get("notes"));
                exchange.getIn().setHeader("notes", notes);
            })
            .doTry()
                // Use existing claim update logic
                .to("direct:updateClaimStatus")
                .log("✅ HTTP: Payment update successful for claim ${header.claimReferenceId}")
                
                .setBody(simple("{ \"success\": true, \"message\": \"Payment updated successfully for claim ${header.claimReferenceId}\" }"))
                .setHeader("Content-Type", constant("application/json"))
                
            .doCatch(Exception.class)
                .log("❌ HTTP: Payment update failed: ${exception.message}")
                .setBody(simple("{ \"success\": false, \"message\": \"Payment update failed: ${exception.message}\" }"))
                .setHeader("Content-Type", constant("application/json"))
            .end();
    }
}
