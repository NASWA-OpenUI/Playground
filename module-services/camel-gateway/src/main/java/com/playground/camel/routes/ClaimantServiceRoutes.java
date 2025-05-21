package com.playground.camel.routes;

import org.apache.camel.builder.RouteBuilder;
import org.springframework.stereotype.Component;

@Component
public class ClaimantServiceRoutes extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        // Existing GraphQL route for queries
        from("direct:claimantServiceGraphQL")
            .routeId("claimant-service-graphql")
            .log("Routing GraphQL request to claimant-services: ${body}")
            .removeHeaders("CamelHttp*") // Remove any existing HTTP headers
            .setHeader("Content-Type", constant("application/json"))
            .setHeader("Accept", constant("application/json"))
            .to("http://claimant-services:3000/graphql")
            .log("Received response from claimant-services");
            
        // New route for handling claim submissions via GraphQL mutation
        from("direct:processClaim")
            .routeId("process-claim-via-graphql")
            .log("Processing claim submission via GraphQL: ${body}")
            // Extract claim data from GraphQL mutation response
            .bean("dataTransformer", "extractClaimFromGraphQL")
            // Transform to claims-processing format
            .bean("dataTransformer", "transformClaimToProcessingFormat")
            .removeHeaders("CamelHttp*")
            .setHeader("Content-Type", constant("application/json"))
            .setHeader("Accept", constant("application/json"))
            // Forward to the claims-processing service
            .to("http://claims-processing:8000/api/claims")
            .log("Forwarded claim to claims-processing service");

        // Create a REST endpoint that will front the GraphQL service
        rest("/claimant")
            .id("claimant-api")
            .description("Claimant Services API")
            .consumes("application/json")
            .produces("application/json")
            
            // Forward all POST requests to the GraphQL endpoint
            .post("/graphql")
                .description("GraphQL endpoint for Claimant Services")
                .to("direct:claimantServiceGraphQL");
                
        // Add a custom route to intercept createClaim GraphQL mutations
        interceptFrom("direct:claimantServiceGraphQL")
            .choice()
                .when(simple("${body} contains 'mutation CreateClaim'"))
                    .wireTap("direct:processClaim")
                .end();
    }
}
