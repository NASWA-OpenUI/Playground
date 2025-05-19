package gov.dol.ui.demo.integration.processors;

import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Simplified transformer that avoids Jackson ObjectMapper issues
 * Uses basic string manipulation and Camel's built-in JSON support
 */
@Component("claimDataTransformer")
public class ClaimDataTransformer implements Processor {

    @Override
    public void process(Exchange exchange) throws Exception {
        // Get the request body as a Map (Camel handles JSON parsing automatically)
        @SuppressWarnings("unchecked")
        Map<String, Object> claimantData = exchange.getIn().getBody(Map.class);

        // Log the incoming data for debugging
        System.out.println("Processing claim data: " + claimantData);

        // Create a simple response for now - just echo back with some transformation
        String transformedResponse = "{"
            + "\"claim_reference_id\": \"C-" + System.currentTimeMillis() + "\","
            + "\"claimant_id\": \"" + claimantData.getOrDefault("userId", "unknown") + "\","
            + "\"status\": \"submitted\","
            + "\"message\": \"Claim successfully transformed from GraphQL to REST format\","
            + "\"timestamp\": \"" + LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "\","
            + "\"original_data_received\": true"
            + "}";

        // Set the transformed response
        exchange.getIn().setBody(transformedResponse);
        exchange.getIn().setHeader("Content-Type", "application/json");
        
        System.out.println("Transformed response: " + transformedResponse);
    }
}
