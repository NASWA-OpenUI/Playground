package com.playground.camel.routes;

import org.apache.camel.builder.RouteBuilder;
import org.springframework.stereotype.Component;

@Component
public class IntegrationRoutes extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        
        // Main processing route - now saves to database instead of forwarding
        from("direct:processSubmission")
            .routeId("submission-processor")
            .log("📥 Received claim submission: ${body}")
            .doTry()
                // Transform the incoming JSON to our standardized Claim entity
                .bean("dataTransformer", "transformClaimantServicesClaim")
                .log("✅ Transformed claim data successfully")
                
                // Save the claim to our database
                .bean("claimService", "createClaim")
                .log("💾 Saved claim to database: ${body.claimReferenceId}")
                
                // Prepare success response
                .setBody(simple("{ \"status\": \"success\", \"claimReferenceId\": \"${body.claimReferenceId}\", \"message\": \"Claim received and stored successfully\", \"statusCode\": \"${body.statusCode}\", \"workflowStage\": \"${body.workflowStage}\" }"))
                .setHeader("Content-Type", constant("application/json"))
                
            .doCatch(Exception.class)
                .log("❌ Error processing claim submission: ${exception.message}")
                .setBody(simple("{ \"status\": \"error\", \"message\": \"Failed to process claim: ${exception.message}\" }"))
                .setHeader("Content-Type", constant("application/json"))
            .end();

        // Health check routes for service monitoring
        from("timer://healthCheck?period=30000")
            .routeId("health-checker")
            .log("🔍 Running health checks...")
            .to("direct:updateServiceStatus");

        from("direct:updateServiceStatus")
            .routeId("service-status-updater")
            .bean("healthMonitor", "checkAllServices")
            .log("✅ Health check completed");

        // Route for getting service status (called by Spring controller)
        from("direct:getServiceStatus")
            .routeId("service-status-getter")
            .bean("healthMonitor", "getCurrentStatus")
            .setHeader("Content-Type", constant("application/json"));

        // New routes for claim management and querying
        
        // Route to get claims by status (for other services to query)
        from("direct:getClaimsByStatus")
            .routeId("get-claims-by-status")
            .log("🔍 Fetching claims with status: ${header.statusCode}")
            .bean("claimService", "getClaimsByStatus(${header.statusCode})")
            .marshal().json()
            .setHeader("Content-Type", constant("application/json"));

        // Route to get claims ready for specific processing stages
        from("direct:getClaimsForEmployerVerification")
            .routeId("get-claims-employer-verification")
            .log("🔍 Fetching claims ready for employer verification")
            .bean("claimService", "getClaimsReadyForEmployerVerification")
            .marshal().json()
            .setHeader("Content-Type", constant("application/json"));

        from("direct:getClaimsForTaxCalculation")
            .routeId("get-claims-tax-calculation")
            .log("🔍 Fetching claims ready for tax calculation")
            .bean("claimService", "getClaimsReadyForTaxCalculation")
            .marshal().json()
            .setHeader("Content-Type", constant("application/json"));

        from("direct:getClaimsForFinalReview")
            .routeId("get-claims-final-review")
            .log("🔍 Fetching claims ready for final review")
            .bean("claimService", "getClaimsReadyForFinalReview")
            .marshal().json()
            .setHeader("Content-Type", constant("application/json"));

        // Route to update claim status (for other services to use)
        from("direct:updateClaimStatus")
            .routeId("update-claim-status")
            .log("📝 Updating claim status: ${header.claimReferenceId} -> ${header.statusCode}")
            .bean("claimService", "updateClaimStatus(${header.claimReferenceId}, ${header.statusCode}, ${header.statusDisplayName}, ${header.updatedBy}, ${header.notes})")
            .marshal().json()
            .setHeader("Content-Type", constant("application/json"));

        // Route to advance claim workflow
        from("direct:advanceClaimWorkflow")
            .routeId("advance-claim-workflow")
            .log("⚡ Advancing workflow for claim: ${header.claimReferenceId}")
            .bean("claimService", "advanceClaimWorkflow(${header.claimReferenceId}, ${header.updatedBy})")
            .marshal().json()
            .setHeader("Content-Type", constant("application/json"));

        // Route to record claim errors
        from("direct:recordClaimError")
            .routeId("record-claim-error")
            .log("❌ Recording error for claim: ${header.claimReferenceId}")
            .bean("claimService", "recordClaimError(${header.claimReferenceId}, ${header.errorMessage}, ${header.updatedBy})")
            .marshal().json()
            .setHeader("Content-Type", constant("application/json"));
    }
}