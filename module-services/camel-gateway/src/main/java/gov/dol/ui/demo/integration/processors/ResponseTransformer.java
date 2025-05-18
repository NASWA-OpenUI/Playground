package gov.dol.ui.demo.integration.processors;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.springframework.stereotype.Component;

/**
 * Transforms responses from Claims Processing (REST) back to GraphQL format for Claimant Services
 */
@Component("responseTransformer")
public class ResponseTransformer implements Processor {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void process(Exchange exchange) throws Exception {
        String inputBody = exchange.getIn().getBody(String.class);
        JsonNode claimsResponse = objectMapper.readTree(inputBody);

        // Create GraphQL-style response
        ObjectNode graphqlResponse = objectMapper.createObjectNode();

        // Transform the response back to GraphQL format
        if (claimsResponse.has("claim_reference_id")) {
            graphqlResponse.put("claimId", claimsResponse.path("claim_reference_id").asText());
        }

        if (claimsResponse.has("claimant_id")) {
            graphqlResponse.put("userId", claimsResponse.path("claimant_id").asText());
        }

        if (claimsResponse.has("claim_status")) {
            String snakeCaseStatus = claimsResponse.path("claim_status").asText();
            graphqlResponse.put("status", transformStatusToCamelCase(snakeCaseStatus));
        }

        if (claimsResponse.has("created_at")) {
            graphqlResponse.put("submissionDate", claimsResponse.path("created_at").asText());
        }

        // Add success indicator
        graphqlResponse.put("success", true);
        graphqlResponse.put("message", "Claim successfully submitted to processing system");

        // Wrap in GraphQL mutation response format
        ObjectNode data = objectMapper.createObjectNode();
        data.set("createClaim", graphqlResponse);

        ObjectNode finalResponse = objectMapper.createObjectNode();
        finalResponse.set("data", data);

        exchange.getIn().setBody(finalResponse.toString());
        exchange.getIn().setHeader("Content-Type", "application/json");
    }

    private String transformStatusToCamelCase(String snakeCaseStatus) {
        // Convert snake_case status to camelCase
        switch (snakeCaseStatus.toLowerCase()) {
            case "submitted":
                return "submitted";
            case "waiting_for_employer":
                return "waitingForEmployer";
            case "processing":
                return "processing";
            case "approved":
                return "approved";
            case "denied":
                return "denied";
            default:
                return "submitted";
        }
    }
}