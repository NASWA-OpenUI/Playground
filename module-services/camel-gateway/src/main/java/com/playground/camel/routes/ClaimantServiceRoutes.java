package com.playground.camel.routes;

import org.apache.camel.builder.RouteBuilder;
import org.springframework.stereotype.Component;

@Component
public class ClaimantServiceRoutes extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        
        // GraphQL forwarding route for direct GraphQL requests to claimant-services
        from("direct:claimantServiceGraphQL")
            .routeId("claimant-service-graphql")
            .log("Routing GraphQL request to claimant-services: ${body}")
            .removeHeaders("CamelHttp*") // Remove any existing HTTP headers
            .setHeader("Content-Type", constant("application/json"))
            .setHeader("Accept", constant("application/json"))
            .to("http://claimant-services:3000/graphql")
            .log("Received response from claimant-services");

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

        // Note: The old processClaim route has been removed because we now handle
        // claim processing through the main /api/submit endpoint in IntegrationRoutes
        // which saves directly to the database instead of forwarding to another service
    }
}