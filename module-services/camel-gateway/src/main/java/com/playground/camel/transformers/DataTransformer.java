package com.playground.camel.transformers;

import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@Component
public class DataTransformer {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Extracts claim data from a GraphQL mutation response
     * 
     * @param graphQLResponse The response from the GraphQL API
     * @return The extracted claim data as a JSON string
     */
    public String extractClaimFromGraphQL(String graphQLResponse) throws Exception {
        JsonNode responseNode = objectMapper.readTree(graphQLResponse);
        
        // Navigate to the actual claim data in the GraphQL response
        if (responseNode.has("data") && responseNode.get("data").has("createClaim")) {
            return objectMapper.writeValueAsString(responseNode.get("data").get("createClaim"));
        }
        
        throw new IllegalArgumentException("Invalid GraphQL response format - cannot extract claim data");
    }

    /**
     * Transforms claim data from claimant-services format to claims-processing format
     * 
     * @param claimJson The claim data in JSON format
     * @return The transformed claim data as a JSON string
     */
    public String transformClaimToProcessingFormat(String claimJson) throws Exception {
        JsonNode claimNode = objectMapper.readTree(claimJson);
        ObjectNode transformedClaim = objectMapper.createObjectNode();
        
        // Map fields from claimant-services format to claims-processing format
        // This is where we handle the field name differences between services
        
        // Claim reference ID
        if (claimNode.has("claimId")) {
            transformedClaim.put("claim_reference_id", claimNode.get("claimId").asText());
        }
        
        // Claimant information
        if (claimNode.has("firstName") && claimNode.has("lastName")) {
            ObjectNode transformedClaimant = objectMapper.createObjectNode();
            
            transformedClaimant.put("claimant_id", claimNode.has("userId") ? claimNode.get("userId").asText() : "");
            transformedClaimant.put("first_name", claimNode.get("firstName").asText());
            transformedClaimant.put("last_name", claimNode.get("lastName").asText());
            if (claimNode.has("ssn")) transformedClaimant.put("ssn", claimNode.get("ssn").asText());
            if (claimNode.has("dateOfBirth")) transformedClaimant.put("birth_date", claimNode.get("dateOfBirth").asText());
            
            // Contact information
            ObjectNode transformedContact = objectMapper.createObjectNode();
            if (claimNode.has("email")) transformedContact.put("email_address", claimNode.get("email").asText());
            if (claimNode.has("phone")) transformedContact.put("phone_number", claimNode.get("phone").asText());
            
            // Address
            if (claimNode.has("address")) {
                JsonNode address = claimNode.get("address");
                ObjectNode transformedAddress = objectMapper.createObjectNode();
                
                if (address.has("street")) transformedAddress.put("street", address.get("street").asText());
                if (address.has("city")) transformedAddress.put("city", address.get("city").asText());
                if (address.has("state")) transformedAddress.put("state", address.get("state").asText());
                if (address.has("zipCode")) transformedAddress.put("postal_code", address.get("zipCode").asText());
                
                transformedContact.set("mailing_address", transformedAddress);
            }
            
            transformedClaimant.set("contact_info", transformedContact);
            transformedClaim.set("claimant", transformedClaimant);
        }
        
        // Employment information
        if (claimNode.has("employer")) {
            JsonNode employment = claimNode.get("employer");
            ObjectNode transformedEmployment = objectMapper.createObjectNode();
            
            // Employer
            ObjectNode transformedEmployer = objectMapper.createObjectNode();
            if (employment.has("name")) transformedEmployer.put("business_name", employment.get("name").asText());
            if (employment.has("ein")) transformedEmployer.put("employer_id", employment.get("ein").asText());
            transformedEmployment.set("employer", transformedEmployer);
            
            // Employment dates
            if (claimNode.has("employmentDates")) {
                JsonNode dates = claimNode.get("employmentDates");
                ObjectNode transformedDates = objectMapper.createObjectNode();
                
                if (dates.has("startDate")) transformedDates.put("start", dates.get("startDate").asText());
                if (dates.has("endDate")) transformedDates.put("end", dates.get("endDate").asText());
                
                transformedEmployment.set("employment_period", transformedDates);
            }
            
            // Separation details
            if (claimNode.has("separationReason")) {
                transformedEmployment.put("separation_reason_code", claimNode.get("separationReason").asText());
            }
            if (claimNode.has("separationDetails")) {
                transformedEmployment.put("separation_explanation", claimNode.get("separationDetails").asText());
            }
            
            transformedClaim.set("employment_record", transformedEmployment);
        }
        
        // Wage information
        if (claimNode.has("wageData")) {
            JsonNode wages = claimNode.get("wageData");
            ObjectNode transformedWages = objectMapper.createObjectNode();
            
            if (wages.has("lastQuarterEarnings")) 
                transformedWages.put("base_period_q4", wages.get("lastQuarterEarnings").asDouble());
            if (wages.has("annualEarnings")) 
                transformedWages.put("total_earnings", wages.get("annualEarnings").asDouble());
            
            transformedClaim.set("wage_history", transformedWages);
        }
        
        // Status information
        if (claimNode.has("status")) {
            ObjectNode transformedStatus = objectMapper.createObjectNode();
            transformedStatus.put("status_code", claimNode.get("status").asText());
            
            if (claimNode.has("submissionTimestamp")) 
                transformedStatus.put("submission_date", claimNode.get("submissionTimestamp").asText());
            
            transformedClaim.set("claim_status", transformedStatus);
        }
        
        // Add processing metadata
        ObjectNode metadata = objectMapper.createObjectNode();
        metadata.put("source_system", "claimant-services");
        metadata.put("received_timestamp", System.currentTimeMillis());
        transformedClaim.set("metadata", metadata);
        
        return objectMapper.writeValueAsString(transformedClaim);
    }
}
