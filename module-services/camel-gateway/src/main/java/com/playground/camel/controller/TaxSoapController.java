package com.playground.camel.controller;

import com.playground.camel.model.Claim;
import com.playground.camel.service.ClaimService;
import com.playground.camel.repository.ClaimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.xml.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Endpoint
public class TaxSoapController {

    private static final Logger logger = LoggerFactory.getLogger(TaxSoapController.class);
    private static final String NAMESPACE_URI = "http://camel-gateway/tax";

    @Autowired
    private ClaimService claimService;
    
    @Autowired
    private ClaimRepository claimRepository;

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "UpdateTaxCalculation")
    @ResponsePayload
    public UpdateTaxCalculationResponse updateTaxCalculation(@RequestPayload UpdateTaxCalculationRequest request) {
        logger.info("🧮 SOAP Tax calculation received for claim: {}", request.getClaimId());
        
        // Enhanced debugging to see what we're actually receiving
        logger.info("🔍 Raw request object: {}", request);
        logger.info("🔍 Request claimId: '{}'", request.getClaimId());
        logger.info("🔍 Request stateTaxAmount: {}", request.getStateTaxAmount());
        logger.info("🔍 Request federalTaxAmount: {}", request.getFederalTaxAmount());
        logger.info("🔍 Request totalTaxAmount: {}", request.getTotalTaxAmount());
        logger.info("🔍 Request calculatedBy: '{}'", request.getCalculatedBy());
        
        try {
            // Check if claimId is null or empty
            if (request.getClaimId() == null) {
                logger.error("❌ ClaimId is NULL in request");
                return createErrorResponse("INVALID_REQUEST", "ClaimId cannot be null");
            }
            
            if (request.getClaimId().trim().isEmpty()) {
                logger.error("❌ ClaimId is EMPTY in request");
                return createErrorResponse("INVALID_REQUEST", "ClaimId cannot be empty");
            }
            
            logger.info("✅ ClaimId is valid: '{}'", request.getClaimId());
            
            // Find the claim
            Optional<Claim> claimOpt = claimService.getClaimByReferenceId(request.getClaimId());
            if (!claimOpt.isPresent()) {
                logger.error("❌ Claim not found: {}", request.getClaimId());
                return createErrorResponse("CLAIM_NOT_FOUND", "Claim not found: " + request.getClaimId());
            }
            
            Claim claim = claimOpt.get();
            logger.info("✅ Found claim: {}", claim.getClaimReferenceId());
            
            // Validate claim is in correct status for tax calculation
            if (!Claim.Status.AWAITING_TAX_CALC.equals(claim.getStatusCode())) {
                logger.warn("⚠️ Claim {} not in correct status for tax calculation. Current status: {}", 
                    request.getClaimId(), claim.getStatusCode());
                return createErrorResponse("INVALID_STATUS", 
                    "Claim not ready for tax calculation. Current status: " + claim.getStatusCode());
            }
            
            // Update claim with tax calculation results
            claim.setStateTaxAmount(request.getStateTaxAmount());
            claim.setFederalTaxAmount(request.getFederalTaxAmount());
            claim.setTotalTaxAmount(request.getTotalTaxAmount());
            claim.setTaxCalculationDate(LocalDateTime.now());
            
            // Add processing note
            String taxNote = String.format("Tax calculation completed: State=$%.2f, Federal=$%.2f, Total=$%.2f (Rates: State=%.4f, Federal=%.4f)",
                request.getStateTaxAmount(), request.getFederalTaxAmount(), request.getTotalTaxAmount(),
                request.getStateTaxRate(), request.getFederalTaxRate());
            
            claim.addProcessingNote(taxNote);
            claim.setUpdatedBy(request.getCalculatedBy() != null ? request.getCalculatedBy() : "tax-services");
            
            // Update status to indicate tax calculation is complete
            claim.updateStatus("AWAITING_PAYMENT", "Tax Calculation Complete - Awaiting Payment Processing", 
                request.getCalculatedBy() != null ? request.getCalculatedBy() : "tax-services");
            
            // Update workflow stage
            claim.updateWorkflowStage(Claim.WorkflowStage.FINAL_REVIEW, 
                request.getCalculatedBy() != null ? request.getCalculatedBy() : "tax-services");
            
            // Save the updated claim
            Claim updatedClaim = claimRepository.save(claim);
            
            logger.info("✅ Tax calculation completed for claim {}: State=${}, Federal=${}, Total=${}", 
                request.getClaimId(), request.getStateTaxAmount(), 
                request.getFederalTaxAmount(), request.getTotalTaxAmount());
            
            // Return success response
            UpdateTaxCalculationResponse response = new UpdateTaxCalculationResponse();
            response.setStatus("SUCCESS");
            response.setMessage("Tax calculation updated successfully");
            response.setClaimId(request.getClaimId());
            response.setNewStatus(updatedClaim.getStatusCode());
            response.setNewWorkflowStage(updatedClaim.getWorkflowStage());
            response.setProcessedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            return response;
            
        } catch (Exception e) {
            logger.error("❌ Error processing tax calculation for claim {}: {}", request.getClaimId(), e.getMessage(), e);
            return createErrorResponse("PROCESSING_ERROR", "Error processing tax calculation: " + e.getMessage());
        }
    }
    
    private UpdateTaxCalculationResponse createErrorResponse(String errorCode, String errorMessage) {
        UpdateTaxCalculationResponse response = new UpdateTaxCalculationResponse();
        response.setStatus("ERROR");
        response.setMessage(errorMessage);
        response.setErrorCode(errorCode);
        response.setProcessedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        return response;
    }

    // SOAP Request/Response classes
    @XmlRootElement(name = "UpdateTaxCalculation", namespace = NAMESPACE_URI)
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class UpdateTaxCalculationRequest {
        
        @XmlElement(name = "claimId", namespace = NAMESPACE_URI, required = true)
        private String claimId;
        
        @XmlElement(name = "stateTaxAmount", namespace = NAMESPACE_URI, required = true)
        private BigDecimal stateTaxAmount;
        
        @XmlElement(name = "federalTaxAmount", namespace = NAMESPACE_URI, required = true)
        private BigDecimal federalTaxAmount;
        
        @XmlElement(name = "totalTaxAmount", namespace = NAMESPACE_URI, required = true)
        private BigDecimal totalTaxAmount;
        
        @XmlElement(name = "stateTaxRate", namespace = NAMESPACE_URI)
        private BigDecimal stateTaxRate;
        
        @XmlElement(name = "federalTaxRate", namespace = NAMESPACE_URI)
        private BigDecimal federalTaxRate;
        
        @XmlElement(name = "calculatedBy", namespace = NAMESPACE_URI)
        private String calculatedBy;
        
        @XmlElement(name = "calculatedAt", namespace = NAMESPACE_URI)
        private String calculatedAt;
        
        // Getters and Setters
        public String getClaimId() { return claimId; }
        public void setClaimId(String claimId) { this.claimId = claimId; }
        
        public BigDecimal getStateTaxAmount() { return stateTaxAmount; }
        public void setStateTaxAmount(BigDecimal stateTaxAmount) { this.stateTaxAmount = stateTaxAmount; }
        
        public BigDecimal getFederalTaxAmount() { return federalTaxAmount; }
        public void setFederalTaxAmount(BigDecimal federalTaxAmount) { this.federalTaxAmount = federalTaxAmount; }
        
        public BigDecimal getTotalTaxAmount() { return totalTaxAmount; }
        public void setTotalTaxAmount(BigDecimal totalTaxAmount) { this.totalTaxAmount = totalTaxAmount; }
        
        public BigDecimal getStateTaxRate() { return stateTaxRate; }
        public void setStateTaxRate(BigDecimal stateTaxRate) { this.stateTaxRate = stateTaxRate; }
        
        public BigDecimal getFederalTaxRate() { return federalTaxRate; }
        public void setFederalTaxRate(BigDecimal federalTaxRate) { this.federalTaxRate = federalTaxRate; }
        
        public String getCalculatedBy() { return calculatedBy; }
        public void setCalculatedBy(String calculatedBy) { this.calculatedBy = calculatedBy; }
        
        public String getCalculatedAt() { return calculatedAt; }
        public void setCalculatedAt(String calculatedAt) { this.calculatedAt = calculatedAt; }
        
        @Override
        public String toString() {
            return "UpdateTaxCalculationRequest{" +
                    "claimId='" + claimId + '\'' +
                    ", stateTaxAmount=" + stateTaxAmount +
                    ", federalTaxAmount=" + federalTaxAmount +
                    ", totalTaxAmount=" + totalTaxAmount +
                    ", stateTaxRate=" + stateTaxRate +
                    ", federalTaxRate=" + federalTaxRate +
                    ", calculatedBy='" + calculatedBy + '\'' +
                    ", calculatedAt='" + calculatedAt + '\'' +
                    '}';
        }
    }

    @XmlRootElement(name = "UpdateTaxCalculationResponse", namespace = NAMESPACE_URI)
    @XmlAccessorType(XmlAccessType.FIELD)
    public static class UpdateTaxCalculationResponse {
        
        @XmlElement(name = "status", namespace = NAMESPACE_URI, required = true)
        private String status;
        
        @XmlElement(name = "message", namespace = NAMESPACE_URI, required = true)
        private String message;
        
        @XmlElement(name = "claimId", namespace = NAMESPACE_URI)
        private String claimId;
        
        @XmlElement(name = "newStatus", namespace = NAMESPACE_URI)
        private String newStatus;
        
        @XmlElement(name = "newWorkflowStage", namespace = NAMESPACE_URI)
        private String newWorkflowStage;
        
        @XmlElement(name = "errorCode", namespace = NAMESPACE_URI)
        private String errorCode;
        
        @XmlElement(name = "processedAt", namespace = NAMESPACE_URI)
        private String processedAt;
        
        // Getters and Setters
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public String getClaimId() { return claimId; }
        public void setClaimId(String claimId) { this.claimId = claimId; }
        
        public String getNewStatus() { return newStatus; }
        public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
        
        public String getNewWorkflowStage() { return newWorkflowStage; }
        public void setNewWorkflowStage(String newWorkflowStage) { this.newWorkflowStage = newWorkflowStage; }
        
        public String getErrorCode() { return errorCode; }
        public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
        
        public String getProcessedAt() { return processedAt; }
        public void setProcessedAt(String processedAt) { this.processedAt = processedAt; }
    }
}
