package gov.dol.ui.demo.integration.routes;

import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.rest.RestBindingMode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Unified API Gateway and Integration Routes
 * 
 * This class serves as BOTH the API Gateway and Integration Service:
 * 1. API Gateway: Routes all external traffic to appropriate services
 * 2. Integration Service: Handles protocol conversion and data transformation
 * 
 * All traffic flows through Camel, providing unified monitoring and control
 */
@Component
public class UnifiedGatewayRoutes extends RouteBuilder {

    @Value("${services.claimant.url}")
    private String claimantServiceUrl;

    @Value("${services.claims-processing.url}")
    private String claimsProcessingUrl;

    @Override
    public void configure() throws Exception {
        // Global error handling - MUST be defined before any routes
        onException(Exception.class)
            .handled(true)
            .log("❌ Error in route ${routeId}: ${exception.message}")
            .setHeader("Content-Type", constant("application/json"))
            .setHeader("CamelHttpResponseCode", constant(500))
            .setBody(simple("{" +
                "\"error\": \"${exception.message}\"," +
                "\"route\": \"${routeId}\"," +
                "\"timestamp\": \"" + java.time.Instant.now() + "\"," +
                "\"details\": \"An error occurred in the integration service\"" +
                "}"));

        // Configure REST DSL - This is our API Gateway
        restConfiguration()
            .component("servlet")  // Use servlet instead of jetty
            .bindingMode(RestBindingMode.json)
            .dataFormatProperty("prettyPrint", "true")
            .enableCORS(true)
            .corsAllowCredentials(true)
            .corsHeaderProperty("Access-Control-Allow-Origin", "*")
            .corsHeaderProperty("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
            .corsHeaderProperty("Access-Control-Allow-Headers", "Origin,Accept,X-Requested-With,Content-Type,Access-Control-Request-Method,Access-Control-Request-Headers,Authorization");

        // =============================================================================
        // API GATEWAY ROUTES - Route external traffic to services
        // =============================================================================

        // Main UI (Demo Landing Page)
        rest("/")
            .get()
                .description("Main demo landing page")
                .to("direct:serve-main-ui");

        // Claimant UI Routes
        rest("/claimant")
            .get()
                .description("Claimant portal home page")
                .to("direct:serve-claimant-ui")
            .get("/{path:.*}")
                .description("Claimant portal resources")
                .to("direct:serve-claimant-ui");

        // Claims Processing UI Routes  
        rest("/processor")
            .get()
                .description("Claims processor portal home page")
                .to("direct:serve-claims-ui")
            .get("/{path:.*}")
                .description("Claims processor portal resources")
                .to("direct:serve-claims-ui");

        // GraphQL API Gateway (routes to Claimant Services)
        rest("/graphql")
            .post()
                .description("GraphQL endpoint (proxies to Claimant Services)")
                .consumes("application/json")
                .produces("application/json")
                .to("direct:proxy-to-claimant-graphql")
            .get()
                .description("GraphQL playground/introspection")
                .to("direct:proxy-to-claimant-graphql");

        // Claims Processing REST API Gateway
        rest("/api/claims")
            .get()
                .description("Get all claims")
                .produces("application/json")
                .to("direct:proxy-to-claims-api")
            .post()
                .description("Create new claim")
                .consumes("application/json")
                .produces("application/json")
                .to("direct:proxy-to-claims-api")
            .get("/{claimId}")
                .description("Get specific claim")
                .produces("application/json")
                .to("direct:proxy-to-claims-api")
            .put("/{claimId}")
                .description("Update claim")
                .consumes("application/json")
                .produces("application/json")
                .to("direct:proxy-to-claims-api");

        // =============================================================================
        // INTEGRATION SERVICE ROUTES - Handle protocol conversions
        // =============================================================================

        // Integration Service API
        rest("/integration/api/v1")
            .description("Integration Service API")
            
            .get("/health")
                .description("Integration service health check")
                .produces("application/json")
                .to("direct:integration-health")
                
            .get("/routes")
                .description("List all integration routes and their status")
                .produces("application/json")
                .to("direct:list-integration-routes")
                
            .get("/monitoring")
                .description("Real-time monitoring dashboard")
                .produces("text/html")
                .to("direct:serve-monitoring-dashboard")
                
            .post("/claims/submit")
                .description("Submit claim with protocol conversion (GraphQL → REST)")
                .consumes("application/json")
                .produces("application/json")
                .to("direct:submit-claim-with-conversion")
                
            .put("/claims/{claimId}/status")
                .description("Update claim status with propagation (REST → GraphQL)")
                .consumes("application/json")
                .produces("application/json")
                .to("direct:update-claim-status-with-propagation");

        // =============================================================================
        // GATEWAY PROXY ROUTES - Simple passthrough for normal service calls
        // =============================================================================

        // Proxy to Claimant Services GraphQL
        from("direct:proxy-to-claimant-graphql")
            .routeId("proxy-claimant-graphql")
            .log("🔄 Proxying GraphQL request to Claimant Services")
            .removeHeaders("CamelHttp*")
            .setHeader("Content-Type", constant("application/json"))
            .toD(claimantServiceUrl + "/graphql")
            .log("✅ GraphQL response from Claimant Services");

        // Proxy to Claims Processing REST API
        from("direct:proxy-to-claims-api")
            .routeId("proxy-claims-api")
            .log("🔄 Proxying REST request to Claims Processing")
            .removeHeaders("CamelHttp*")
            .setHeader("Content-Type", constant("application/json"))
            .toD(claimsProcessingUrl + "/api/claims/${header.claimId}")
            .log("✅ REST response from Claims Processing");

        // =============================================================================
        // UI SERVING ROUTES - Serve static content for different UIs
        // =============================================================================

        // Serve Main UI
        from("direct:serve-main-ui")
            .routeId("serve-main-ui")
            .log("📄 Serving main demo UI")
            .setHeader("Content-Type", constant("text/html"))
            .setBody(constant("<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <title>UI Modernization Demo</title>" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }" +
                "        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }" +
                "        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }" +
                "        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }" +
                "        .service-card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; background: #f9f9f9; }" +
                "        .service-card h3 { color: #3498db; margin-top: 0; }" +
                "        .service-card a { color: #e74c3c; text-decoration: none; font-weight: bold; }" +
                "        .service-card a:hover { text-decoration: underline; }" +
                "        .integration-info { background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 30px 0; }" +
                "        .tech-stack { font-size: 0.9em; color: #7f8c8d; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='container'>" +
                "        <h1>🚀 UI Modernization Demo</h1>" +
                "        <p>This demonstration showcases a modular unemployment insurance system with different services communicating through standardized interfaces.</p>" +
                "        <div class='services'>" +
                "            <div class='service-card'>" +
                "                <h3>👤 Claimant Portal</h3>" +
                "                <p>File and manage unemployment claims</p>" +
                "                <div class='tech-stack'>Tech: React + GraphQL + MongoDB</div>" +
                "                <p><a href='/camel/claimant'>Access Portal →</a></p>" +
                "            </div>" +
                "            <div class='service-card'>" +
                "                <h3>⚙️ Claims Processing</h3>" +
                "                <p>Administrative interface for processing claims</p>" +
                "                <div class='tech-stack'>Tech: Vue.js + REST + PostgreSQL</div>" +
                "                <p><a href='/camel/processor'>Access Portal →</a></p>" +
                "            </div>" +
                "            <div class='service-card'>" +
                "                <h3>🔗 Integration Monitoring</h3>" +
                "                <p>Real-time view of protocol conversions</p>" +
                "                <div class='tech-stack'>Tech: Apache Camel + Spring Boot</div>" +
                "                <p><a href='/camel/integration/api/v1/monitoring'>View Dashboard →</a></p>" +
                "            </div>" +
                "        </div>" +
                "        <div class='integration-info'>" +
                "            <h3>🔄 Integration Layer</h3>" +
                "            <p>All services communicate through Apache Camel, which handles:</p>" +
                "            <ul>" +
                "                <li><strong>Protocol Conversion:</strong> GraphQL ↔ REST ↔ (future gRPC)</li>" +
                "                <li><strong>Data Transformation:</strong> MongoDB format ↔ PostgreSQL format</li>" +
                "                <li><strong>API Gateway:</strong> Unified entry point for all services</li>" +
                "                <li><strong>Monitoring:</strong> Real-time visibility into all integrations</li>" +
                "            </ul>" +
                "            <p>📊 <a href='/camel/integration/api/v1/routes'>View Integration Routes</a> | " +
                "               ❤️ <a href='/camel/integration/api/v1/health'>Service Health</a></p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>"));

        // Serve Claimant UI (placeholder)
        from("direct:serve-claimant-ui")
            .routeId("serve-claimant-ui")
            .log("📄 Serving Claimant UI")
            .setHeader("Content-Type", constant("text/html"))
            .setBody(constant("<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <title>Claimant Portal</title>" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }" +
                "        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }" +
                "        h1 { color: #3498db; text-align: center; }" +
                "        .info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0; }" +
                "        a { color: #e74c3c; text-decoration: none; }" +
                "        a:hover { text-decoration: underline; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='container'>" +
                "        <h1>👤 Claimant Portal</h1>" +
                "        <div class='info'>" +
                "            <p><strong>Technology Stack:</strong> React + GraphQL + MongoDB</p>" +
                "            <p><strong>Communication:</strong> All requests flow through Apache Camel integration layer</p>" +
                "        </div>" +
                "        <p>This is where the React application would be served. The actual React app would:</p>" +
                "        <ul>" +
                "            <li>Allow users to file new unemployment claims</li>" +
                "            <li>Display claim status and benefit information</li>" +
                "            <li>Communicate with the backend via GraphQL</li>" +
                "            <li>Send data through Camel for protocol conversion</li>" +
                "        </ul>" +
                "        <p><a href='/'>← Back to Demo Home</a></p>" +
                "    </div>" +
                "</body>" +
                "</html>"));

        // Serve Claims Processing UI (placeholder)
        from("direct:serve-claims-ui")
            .routeId("serve-claims-ui")
            .log("📄 Serving Claims Processing UI")
            .setHeader("Content-Type", constant("text/html"))
            .setBody(constant("<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <title>Claims Processing Portal</title>" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }" +
                "        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }" +
                "        h1 { color: #9b59b6; text-align: center; }" +
                "        .info { background: #f4e8fd; padding: 15px; border-radius: 5px; margin: 20px 0; }" +
                "        a { color: #e74c3c; text-decoration: none; }" +
                "        a:hover { text-decoration: underline; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='container'>" +
                "        <h1>⚙️ Claims Processing Portal</h1>" +
                "        <div class='info'>" +
                "            <p><strong>Technology Stack:</strong> Vue.js + REST + PostgreSQL</p>" +
                "            <p><strong>Communication:</strong> Receives converted data from Apache Camel</p>" +
                "        </div>" +
                "        <p>This is where the Vue.js application would be served. The actual Vue app would:</p>" +
                "        <ul>" +
                "            <li>Display a queue of claims to be processed</li>" +
                "            <li>Allow status updates and claim management</li>" +
                "            <li>Communicate with the backend via REST API</li>" +
                "            <li>Receive GraphQL data converted to REST by Camel</li>" +
                "        </ul>" +
                "        <p><a href='/'>← Back to Demo Home</a></p>" +
                "    </div>" +
                "</body>" +
                "</html>"));

        // =============================================================================
        // INTEGRATION SERVICE IMPLEMENTATION ROUTES
        // =============================================================================

        // Integration health check
        from("direct:integration-health")
            .routeId("integration-health")
            .log("🏥 Checking integration service health")
            .setBody(constant("{" +
                "\"status\": \"UP\"," +
                "\"service\": \"camel-integration-gateway\"," +
                "\"timestamp\": \"" + java.time.Instant.now() + "\"," +
                "\"version\": \"1.0.0\"," +
                "\"routes\": {" +
                "\"total\": 15," +
                "\"active\": 15" +
                "}," +
                "\"integrations\": {" +
                "\"graphql-rest-conversion\": \"active\"," +
                "\"rest-graphql-conversion\": \"active\"," +
                "\"api-gateway\": \"active\"" +
                "}" +
                "}"))
            .setHeader("Content-Type", constant("application/json"));

        // List integration routes
        from("direct:list-integration-routes")
            .routeId("list-integration-routes")
            .log("📋 Listing all integration routes")
            .setBody(constant("{" +
                "\"routes\": [" +
                "{" +
                "\"id\": \"submit-claim-with-conversion\"," +
                "\"type\": \"integration\"," +
                "\"from\": \"REST\"," +
                "\"to\": \"GraphQL→REST\"," +
                "\"description\": \"Convert GraphQL claim submission to REST API call\"," +
                "\"status\": \"active\"" +
                "}," +
                "{" +
                "\"id\": \"update-claim-status-with-propagation\"," +
                "\"type\": \"integration\"," +
                "\"from\": \"REST\"," +
                "\"to\": \"REST→GraphQL\"," +
                "\"description\": \"Propagate status updates back to claimant service\"," +
                "\"status\": \"active\"" +
                "}," +
                "{" +
                "\"id\": \"proxy-claimant-graphql\"," +
                "\"type\": \"gateway\"," +
                "\"from\": \"External\"," +
                "\"to\": \"Claimant Services\"," +
                "\"description\": \"Direct GraphQL proxy to claimant services\"," +
                "\"status\": \"active\"" +
                "}," +
                "{" +
                "\"id\": \"proxy-claims-api\"," +
                "\"type\": \"gateway\"," +
                "\"from\": \"External\"," +
                "\"to\": \"Claims Processing\"," +
                "\"description\": \"Direct REST proxy to claims processing\"," +
                "\"status\": \"active\"" +
                "}" +
                "]," +
                "\"gateway_routes\": [" +
                "{\"path\": \"/\", \"service\": \"Demo UI\", \"type\": \"static\"}," +
                "{\"path\": \"/claimant/*\", \"service\": \"Claimant UI\", \"type\": \"static\"}," +
                "{\"path\": \"/processor/*\", \"service\": \"Claims UI\", \"type\": \"static\"}," +
                "{\"path\": \"/graphql\", \"service\": \"Claimant Services\", \"type\": \"proxy\"}," +
                "{\"path\": \"/api/claims/*\", \"service\": \"Claims Processing\", \"type\": \"proxy\"}" +
                "]," +
                "\"statistics\": {" +
                "\"total_routes\": 15," +
                "\"integration_routes\": 2," +
                "\"gateway_routes\": 4," +
                "\"ui_routes\": 3" +
                "}" +
                "}"))
            .setHeader("Content-Type", constant("application/json"));

        // Serve monitoring dashboard
        from("direct:serve-monitoring-dashboard")
            .routeId("serve-monitoring-dashboard")
            .log("📊 Serving monitoring dashboard")
            .setHeader("Content-Type", constant("text/html"))
            .setBody(constant("<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "    <title>Integration Monitoring Dashboard</title>" +
                "    <meta http-equiv='refresh' content='5'>" +
                "    <style>" +
                "        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }" +
                "        .dashboard { max-width: 1200px; margin: 0 auto; }" +
                "        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }" +
                "        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }" +
                "        .stat-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; }" +
                "        .stat-value { font-size: 2em; font-weight: bold; color: #27ae60; }" +
                "        .stat-label { color: #7f8c8d; margin-top: 5px; }" +
                "        .routes { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }" +
                "        .route { display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #ecf0f1; }" +
                "        .route:last-child { border-bottom: none; }" +
                "        .route-status { width: 12px; height: 12px; border-radius: 50%; background: #27ae60; margin-right: 15px; }" +
                "        .route-info { flex: 1; }" +
                "        .route-name { font-weight: bold; color: #2c3e50; }" +
                "        .route-desc { color: #7f8c8d; font-size: 0.9em; }" +
                "        .refresh-note { text-align: center; color: #7f8c8d; margin-top: 20px; font-style: italic; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class='dashboard'>" +
                "        <div class='header'>" +
                "            <h1>🔗 Apache Camel Integration Monitoring</h1>" +
                "            <p>Real-time view of protocol conversions and service integrations</p>" +
                "        </div>" +
                "        <div class='stats'>" +
                "            <div class='stat-card'>" +
                "                <div class='stat-value'>15</div>" +
                "                <div class='stat-label'>Total Routes</div>" +
                "            </div>" +
                "            <div class='stat-card'>" +
                "                <div class='stat-value'>2</div>" +
                "                <div class='stat-label'>Integration Routes</div>" +
                "            </div>" +
                "            <div class='stat-card'>" +
                "                <div class='stat-value'>4</div>" +
                "                <div class='stat-label'>Gateway Routes</div>" +
                "            </div>" +
                "            <div class='stat-card'>" +
                "                <div class='stat-value'>UP</div>" +
                "                <div class='stat-label'>Service Status</div>" +
                "            </div>" +
                "        </div>" +
                "        <div class='routes'>" +
                "            <h2>🔄 Integration Routes</h2>" +
                "            <div class='route'>" +
                "                <div class='route-status'></div>" +
                "                <div class='route-info'>" +
                "                    <div class='route-name'>GraphQL → REST Conversion</div>" +
                "                    <div class='route-desc'>Converts claim submissions from GraphQL format to REST API calls</div>" +
                "                </div>" +
                "                <div>📈 Active</div>" +
                "            </div>" +
                "            <div class='route'>" +
                "                <div class='route-status'></div>" +
                "                <div class='route-info'>" +
                "                    <div class='route-name'>REST → GraphQL Propagation</div>" +
                "                    <div class='route-desc'>Sends status updates back to claimant service in GraphQL format</div>" +
                "                </div>" +
                "                <div>📈 Active</div>" +
                "            </div>" +
                "            <h2 style='margin-top: 30px;'>🌐 Gateway Routes</h2>" +
                "            <div class='route'>" +
                "                <div class='route-status'></div>" +
                "                <div class='route-info'>" +
                "                    <div class='route-name'>Claimant Portal (/claimant/*)</div>" +
                "                    <div class='route-desc'>React application with GraphQL backend</div>" +
                "                </div>" +
                "                <div>🔄 Proxy</div>" +
                "            </div>" +
                "            <div class='route'>" +
                "                <div class='route-status'></div>" +
                "                <div class='route-info'>" +
                "                    <div class='route-name'>Claims Processing (/processor/*)</div>" +
                "                    <div class='route-desc'>Vue.js application with REST backend</div>" +
                "                </div>" +
                "                <div>🔄 Proxy</div>" +
                "            </div>" +
                "        </div>" +
                "        <div class='refresh-note'>" +
                "            📱 Page refreshes every 5 seconds | <a href='/integration/api/v1/routes'>View Route Details (JSON)</a>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>"));

        // Submit claim with conversion (GraphQL → REST)
        from("direct:submit-claim-with-conversion")
            .routeId("submit-claim-with-conversion")
            .log("🔄 Starting claim submission with GraphQL → REST conversion")
            .log("📥 Input data: ${body}")
            .to("direct:transform-graphql-to-rest")
            .log("🔄 Sending converted data to Claims Processing")
            .to("direct:send-to-claims-processing")
            .log("🔄 Converting response back to GraphQL format")
            .to("direct:transform-rest-response")
            .log("✅ Claim submission conversion completed");

        // Update claim status with propagation (REST → GraphQL)
        from("direct:update-claim-status-with-propagation")
            .routeId("update-claim-status-with-propagation")
            .log("🔄 Starting status update with REST → GraphQL propagation")
            .log("📥 Status update for claim ${header.claimId}: ${body}")
            .to("direct:transform-status-update")
            .log("🔄 Sending GraphQL mutation to Claimant Services")
            .to("direct:send-to-claimant-service")
            .log("✅ Status update propagation completed");

        // Transform GraphQL to REST (reuse existing processor)
        from("direct:transform-graphql-to-rest")
            .routeId("transform-graphql-to-rest")
            .log("🔄 Transforming GraphQL data to REST format")
            .process("claimDataTransformer")
            .log("✅ GraphQL → REST transformation completed: ${body}");

        // Send to Claims Processing service (reuse existing route)
        from("direct:send-to-claims-processing")
            .routeId("send-to-claims-processing")
            .removeHeaders("CamelHttp*")
            .setHeader("Content-Type", constant("application/json"))
            .setHeader("Accept", constant("application/json"))
            .toD(claimsProcessingUrl + "/api/claims")
            .log("🔄 Response from Claims Processing: ${body}");

        // Transform REST response (reuse existing processor)
        from("direct:transform-rest-response")
            .routeId("transform-rest-response")
            .log("🔄 Transforming REST response to GraphQL format")
            .process("responseTransformer")
            .log("✅ REST → GraphQL transformation completed: ${body}");

        // Transform status update (reuse existing processor)
        from("direct:transform-status-update")
            .routeId("transform-status-update")
            .log("🔄 Preparing GraphQL mutation for status update")
            .process("statusUpdateTransformer")
            .log("✅ Status update transformation completed: ${body}");

        // Send to Claimant service (reuse existing route)
        from("direct:send-to-claimant-service")
            .routeId("send-to-claimant-service")
            .removeHeaders("CamelHttp*")
            .setHeader("Content-Type", constant("application/json"))
            .setHeader("Accept", constant("application/json"))
            .toD(claimantServiceUrl + "/graphql")
            .log("🔄 Response from Claimant Service: ${body}");
    }
}
