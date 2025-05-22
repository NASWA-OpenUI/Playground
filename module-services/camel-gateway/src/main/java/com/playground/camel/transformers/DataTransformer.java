package com.playground.camel.transformers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.playground.camel.model.Claim;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Component
public class DataTransformer {

    private static final Logger logger = LoggerFactory.getLogger(DataTransformer.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Transform claim data from claimant-services format to standardized Claim entity
     * 
     * @param claimJson The claim data from claimant-services in JSON format
     * @return A standardized Claim entity ready for persistence
     */
    public Claim transformClaimantServicesClaim(String claimJson) throws Exception {
        logger.info("Transforming claimant-services claim data to standardized format");
        
        JsonNode claimNode = objectMapper.readTree(claimJson);
        Claim claim = new Claim();
        
        // Set source system
        claim.setSourceSystem("claimant-services");
        
        // Map claim reference ID
        if (claimNode.has("claimId")) {
            claim.setClaimReferenceId(claimNode.get("claimId").asText());
        }
        
        // Map claimant information
        if (claimNode.has("userId")) {
            claim.setClaimantId(claimNode.get("userId").asText());
        }
        if (claimNode.has("firstName")) {
            claim.setFirstName(claimNode.get("firstName").asText());
        }
        if (claimNode.has("lastName")) {
            claim.setLastName(claimNode.get("lastName").asText());
        }
        if (claimNode.has("ssn")) {
            claim.setSsn(claimNode.get("ssn").asText());
        }
        if (claimNode.has("dateOfBirth")) {
            claim.setBirthDate(parseDate(claimNode.get("dateOfBirth").asText()));
        }
        
        // Map contact information
        if (claimNode.has("email")) {
            claim.setEmailAddress(claimNode.get("email").asText());
        }
        if (claimNode.has("phone")) {
            claim.setPhoneNumber(claimNode.get("phone").asText());
        }
        
        // Map address information
        if (claimNode.has("address")) {
            JsonNode address = claimNode.get("address");
            if (address.has("street")) {
                claim.setStreetAddress(address.get("street").asText());
            }
            if (address.has("city")) {
                claim.setCity(address.get("city").asText());
            }
            if (address.has("state")) {
                claim.setState(address.get("state").asText());
            }
            if (address.has("zipCode")) {
                claim.setPostalCode(address.get("zipCode").asText());
            }
        }
        
        // Map employment information
        if (claimNode.has("employer")) {
            JsonNode employer = claimNode.get("employer");
            if (employer.has("name")) {
                claim.setEmployerName(employer.get("name").asText());
            }
            if (employer.has("ein")) {
                claim.setEmployerId(employer.get("ein").asText());
            }
        }
        
        // Map employment dates
        if (claimNode.has("employmentDates")) {
            JsonNode dates = claimNode.get("employmentDates");
            if (dates.has("startDate")) {
                claim.setEmploymentStartDate(parseDate(dates.get("startDate").asText()));
            }
            if (dates.has("endDate")) {
                claim.setEmploymentEndDate(parseDate(dates.get("endDate").asText()));
            }
        }
        
        // Map separation information
        if (claimNode.has("separationReason")) {
            claim.setSeparationReasonCode(claimNode.get("separationReason").asText());
        }
        if (claimNode.has("separationDetails")) {
            claim.setSeparationExplanation(claimNode.get("separationDetails").asText());
        }
        
        // Map wage information
        if (claimNode.has("wageData")) {
            JsonNode wageData = claimNode.get("wageData");
            if (wageData.has("lastQuarterEarnings")) {
                claim.setBasePeriodQ4(new BigDecimal(wageData.get("lastQuarterEarnings").asText()));
            }
            if (wageData.has("annualEarnings")) {
                claim.setTotalAnnualEarnings(new BigDecimal(wageData.get("annualEarnings").asText()));
            }
        }
        
        // Map timestamps
        if (claimNode.has("submissionTimestamp")) {
            claim.setSubmissionTimestamp(parseDateTime(claimNode.get("submissionTimestamp").asText()));
        }
        
        // Set initial processing metadata
        claim.setCreatedBy("claimant-services");
        claim.addProcessingNote("Claim transformed from claimant-services format");
        
        logger.info("Successfully transformed claim {} from claimant-services format", claim.getClaimReferenceId());
        return claim;
    }

    /**
     * Transform a Claim entity back to claimant-services compatible format
     */
    public String transformClaimToClaimantServicesFormat(Claim claim) throws Exception {
        logger.info("Transforming standardized claim {} to claimant-services format", claim.getClaimReferenceId());
        
        // This method would be used if we need to send data back to claimant-services
        // For now, this is a placeholder - implement as needed
        return objectMapper.writeValueAsString(claim);
    }

    /**
     * Parse date string in various formats to LocalDateTime
     */
    private LocalDateTime parseDate(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }
        
        try {
            // Try common date formats
            if (dateString.contains("T")) {
                // ISO DateTime format
                return LocalDateTime.parse(dateString, DateTimeFormatter.ISO_DATE_TIME);
            } else {
                // Date only format - assume start of day
                return LocalDateTime.parse(dateString + "T00:00:00", DateTimeFormatter.ISO_DATE_TIME);
            }
        } catch (DateTimeParseException e) {
            logger.warn("Failed to parse date string: {}", dateString);
            return null;
        }
    }

    /**
     * Parse datetime string to LocalDateTime
     */
    private LocalDateTime parseDateTime(String dateTimeString) {
        if (dateTimeString == null || dateTimeString.trim().isEmpty()) {
            return null;
        }
        
        try {
            return LocalDateTime.parse(dateTimeString, DateTimeFormatter.ISO_DATE_TIME);
        } catch (DateTimeParseException e) {
            logger.warn("Failed to parse datetime string: {}", dateTimeString);
            return null;
        }
    }

    /**
     * Legacy method for XML transformation (keeping for backward compatibility)
     */
    public String jsonToXml(String jsonData) throws Exception {
        // Legacy XML transformation code...
        // Keep existing implementation for other routes that might need it
        logger.info("Legacy JSON to XML transformation called");
        return "<data>" + jsonData + "</data>"; // Simplified for now
    }

    /**
     * Legacy method for JSON transformation (keeping for backward compatibility)
     */
    public String xmlToJson(String xmlData) throws Exception {
        // Legacy JSON transformation code...
        // Keep existing implementation for other routes that might need it
        logger.info("Legacy XML to JSON transformation called");
        return "{\"data\": \"" + xmlData + "\"}"; // Simplified for now
    }
}