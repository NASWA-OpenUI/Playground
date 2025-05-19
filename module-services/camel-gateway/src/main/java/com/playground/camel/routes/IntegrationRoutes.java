package com.playground.camel.routes;

import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.rest.RestBindingMode;
import org.springframework.stereotype.Component;

@Component
public class IntegrationRoutes extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        
        // Configure REST DSL
        restConfiguration()
            .component("servlet")
            .port(8080)
            .bindingMode(RestBindingMode.json)
            .enableCORS(true);

        // REST endpoint for receiving GraphQL-style submissions
        rest("/api/submit")
            .consumes("application/json")
            .produces("application/json")
            .post().to("direct:processSubmission");

        // Main processing route - converts GraphQL/JSON to REST/XML
        from("direct:processSubmission")
            .routeId("submission-processor")
            .log("Received submission: ${body}")
            .to("direct:transformToXml")
            .to("direct:callReceiveService")
            .to("direct:transformResponse");

        // Transform JSON to XML format
        from("direct:transformToXml")
            .routeId("json-to-xml-transformer")
            .log("Transforming JSON to XML")
            .bean("dataTransformer", "jsonToXml")
            .setHeader("Content-Type", constant("application/xml"));

        // Call the receive service (placeholder for now)
        from("direct:callReceiveService")
            .routeId("receive-service-caller")
            .log("Calling receive service with XML: ${body}")
            // For now, just mock the response
            .setBody(constant("<?xml version=\"1.0\"?><response><status>received</status><message>Successfully processed</message></response>"))
            .setHeader("Content-Type", constant("application/xml"));

        // Transform response back to JSON
        from("direct:transformResponse")
            .routeId("xml-to-json-transformer")
            .log("Transforming XML response to JSON")
            .bean("dataTransformer", "xmlToJson")
            .setHeader("Content-Type", constant("application/json"));

        // Health check routes for service monitoring
        from("timer://healthCheck?period=30000")
            .routeId("health-checker")
            .log("Running health checks...")
            .to("direct:updateServiceStatus");

        from("direct:updateServiceStatus")
            .routeId("service-status-updater")
            .bean("healthMonitor", "checkAllServices")
            .log("Health check completed");

        // Route for dashboard to get current status
        rest("/api/health")
            .get("/services").to("direct:getServiceStatus");

        from("direct:getServiceStatus")
            .routeId("service-status-getter")
            .bean("healthMonitor", "getCurrentStatus")
            .setHeader("Content-Type", constant("application/json"));
    }
}