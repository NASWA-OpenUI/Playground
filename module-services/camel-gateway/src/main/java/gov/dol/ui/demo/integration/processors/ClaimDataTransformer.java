package gov.dol.ui.demo.integration.processors;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Transforms claim data between GraphQL (Claimant Services) and REST (Claims Processing) formats
 * 
 * GraphQL Schema (Claimant Services - MongoDB):
 * - userId (ObjectId string)
 * - personalInfo { firstName, lastName, ssn, dateOfBirth, email, phone }
 * - employmentHistory [{ employerName, employerEIN, startDate, endDate, reasonForSeparation, weeklyWage }]
 * - status (camelCase: "submitted", "waitingForEmployer", etc.)
 * 
 * REST Schema (Claims Processing - PostgreSQL):
 * - claimant_id (string)
 * - claim_reference_id (string, generated)
 * - first_name, last_name, ssn, date_of_birth, email, phone
 * - employment_records [{ employer_name, ein, employment_start, employment_end, separation_reason, weekly_wage }]
 * - claim_status (snake_case: "submitted", "waiting_for_employer", etc.)
 */
@Component("claimDataTransformer")
public class ClaimDataTransformer implements Processor {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void process(Exchange exchange) throws Exception {
        String inputBody = exchange.getIn().getBody(String.class);
        JsonNode claimantData = objectMapper.readTree(inputBody);

        // Create the transformed payload for Claims Processing REST API
        ObjectNode claimsPayload = objectMapper.createObjectNode();

        // Transform basic claim information
        claimsPayload.put("claimant_id", claimantData.path("userId").asText());
        claimsPayload.put("claim_reference_id", generateClaimReferenceId());
        claimsPayload.put("submission_date", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        // Transform personal information
        JsonNode personalInfo = claimantData.path("personalInfo");
        claimsPayload.put("first_name", personalInfo.path("firstName").asText());
        claimsPayload.put("last_name", personalInfo.path("lastName").asText());
        claimsPayload.put("ssn", personalInfo.path("ssn").asText());
        claimsPayload.put("date_of_birth", personalInfo.path("dateOfBirth").asText());
        claimsPayload.put("email", personalInfo.path("email").asText());
        claimsPayload.put("phone", personalInfo.path("phone").asText());

        // Transform employment history
        JsonNode employmentHistory = claimantData.path("employmentHistory");
        if (employmentHistory.isArray() && employmentHistory.size() > 0) {
            JsonNode employment = employmentHistory.get(0); // Most recent employment
            claimsPayload.put("employer_name", employment.path("employerName").asText());
            claimsPayload.put("employer_ein", employment.path("employerEIN").asText());
            claimsPayload.put("employment_start_date", employment.path("startDate").asText());
            claimsPayload.put("employment_end_date", employment.path("endDate").asText());
            claimsPayload.put("separation_reason", employment.path("reasonForSeparation").asText());
            claimsPayload.put("weekly_wage", employment.path("weeklyWage").asDouble());
        }

        // Transform status (camelCase to snake_case)
        String status = claimantData.path("status").asText("submitted");
        claimsPayload.put("claim_status", transformStatusToSnakeCase(status));

        // Add metadata
        claimsPayload.put("source_system", "claimant_services");
        claimsPayload.put("created_at", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

        exchange.getIn().setBody(claimsPayload.toString());
        exchange.getIn().setHeader("Content-Type", "application/json");
    }

    private String generateClaimReferenceId() {
        // Generate a claims processing style reference ID
        return "C-" + LocalDateTime.now().getYear() + "-" + 
               String.format("%06d", (int)(Math.random() * 1000000));
    }

    private String transformStatusToSnakeCase(String camelCaseStatus) {
        // Convert camelCase status to snake_case
        switch (camelCaseStatus.toLowerCase()) {
            case "submitted":
                return "submitted";
            case "waitingforemployer":
            case "waiting_for_employer":
                return "waiting_for_employer";
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