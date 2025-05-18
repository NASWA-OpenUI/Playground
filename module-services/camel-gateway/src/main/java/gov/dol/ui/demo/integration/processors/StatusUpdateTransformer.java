package gov.dol.ui.demo.integration.processors;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.springframework.stereotype.Component;

/**
 * Transforms status updates from Claims Processing back to GraphQL mutations for Claimant Services
 */
@Component("statusUpdateTransformer")
public class StatusUpdateTransformer implements Processor {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void process(Exchange exchange) throws Exception {
        String claimId = exchange.getIn().getHeader("claimId", String.class);
        String inputBody = exchange.getIn().getBody(String.class);
        JsonNode statusUpdate = objectMapper.readTree(inputBody);

        // Create GraphQL mutation for updating claim status
        ObjectNode mutation = objectMapper.createObjectNode();
        
        // Build the GraphQL mutation string
        String newStatus = statusUpdate.path("claim_status").asText();
        String camelCaseStatus = transformStatusToCamelCase(newStatus);
        
        // Create the mutation query
        String graphqlMutation = String.format(
            "mutation { " +
            "  updateClaimStatus(claimId: \"%s\", status: \"%s\") { " +
            "    claimId " +
            "    status " +
            "    updatedAt " +
            "  } " +
            "}", 
            claimId, 
            camelCaseStatus
        );

        ObjectNode queryNode = objectMapper.createObjectNode();
        queryNode.put("query", graphqlMutation);

        // Add variables if needed
        ObjectNode variables = objectMapper.createObjectNode();
        variables.put("claimId", claimId);
        variables.put("status", camelCaseStatus);
        queryNode.set("variables", variables);

        exchange.getIn().setBody(queryNode.toString());
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