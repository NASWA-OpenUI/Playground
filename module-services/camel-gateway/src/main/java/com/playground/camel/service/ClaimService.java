package com.playground.camel.service;

import com.playground.camel.model.Claim;
import com.playground.camel.repository.ClaimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ClaimService {

    private static final Logger logger = LoggerFactory.getLogger(ClaimService.class);

    @Autowired
    private ClaimRepository claimRepository;
    
    @Autowired
    private EventPublisher eventPublisher;

    /**
     * Create a new claim in the gateway database
     */
    public Claim createClaim(Claim claim) {
        logger.info("Creating new claim with reference ID: {}", claim.getClaimReferenceId());
        
        // Ensure the claim doesn't already exist
        if (claimRepository.existsByClaimReferenceId(claim.getClaimReferenceId())) {
            throw new IllegalArgumentException("Claim with reference ID " + claim.getClaimReferenceId() + " already exists");
        }
        
        // Set initial status and workflow stage if not already set
        if (claim.getStatusCode() == null) {
            claim.updateStatus(Claim.Status.RECEIVED, "Received", "system");
        }
        if (claim.getWorkflowStage() == null) {
            claim.updateWorkflowStage(Claim.WorkflowStage.INITIAL, "system");
        }
        
        claim.addProcessingNote("Claim received from " + claim.getSourceSystem());
        
	Claim savedClaim = claimRepository.save(claim);
	logger.info("Successfully created claim with ID: {} (Reference: {})", savedClaim.getId(), savedClaim.getClaimReferenceId());
	eventPublisher.publishClaimReceived(savedClaim.getClaimReferenceId(), savedClaim.getSourceSystem());
	
	return savedClaim;
    }

    /**
     * Update claim status
     */
    public Claim updateClaimStatus(String claimReferenceId, String statusCode, String statusDisplayName, String updatedBy, String notes) {
        logger.info("Updating claim {} status to: {}", claimReferenceId, statusCode);
        
        Claim claim = claimRepository.findByClaimReferenceId(claimReferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Claim not found: " + claimReferenceId));
        
        String previousStatus = claim.getStatusCode();
        claim.updateStatus(statusCode, statusDisplayName, updatedBy);
        
        if (notes != null && !notes.trim().isEmpty()) {
            claim.addProcessingNote("Status changed from " + previousStatus + " to " + statusCode + ": " + notes);
        } else {
            claim.addProcessingNote("Status changed from " + previousStatus + " to " + statusCode);
        }
        
        Claim updatedClaim = claimRepository.save(claim);
        
        // 🔥 FIXED: Publish status change event to Artemis
        eventPublisher.publishStatusChanged(claimReferenceId, previousStatus, statusCode, updatedBy, updatedClaim.getSourceSystem());
        
        logger.info("Successfully updated claim {} status to: {}", claimReferenceId, statusCode);
        return updatedClaim;
    }

    /**
     * Update workflow stage
     */
    public Claim updateWorkflowStage(String claimReferenceId, String workflowStage, String updatedBy, String notes) {
        logger.info("Updating claim {} workflow stage to: {}", claimReferenceId, workflowStage);
        
        Claim claim = claimRepository.findByClaimReferenceId(claimReferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Claim not found: " + claimReferenceId));
        
        String previousStage = claim.getWorkflowStage();
        claim.updateWorkflowStage(workflowStage, updatedBy);
        
        if (notes != null && !notes.trim().isEmpty()) {
            claim.addProcessingNote("Workflow stage changed from " + previousStage + " to " + workflowStage + ": " + notes);
        } else {
            claim.addProcessingNote("Workflow stage changed from " + previousStage + " to " + workflowStage);
        }
        
        Claim updatedClaim = claimRepository.save(claim);
        logger.info("Successfully updated claim {} workflow stage to: {}", claimReferenceId, workflowStage);
        
        return updatedClaim;
    }

    /**
     * Get claim by reference ID
     */
    @Transactional(readOnly = true)
    public Optional<Claim> getClaimByReferenceId(String claimReferenceId) {
        return claimRepository.findByClaimReferenceId(claimReferenceId);
    }

    /**
     * Get all claims
     */
    @Transactional(readOnly = true)
    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    /**
     * Get claims by status
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsByStatus(String statusCode) {
        return claimRepository.findByStatusCode(statusCode);
    }

    /**
     * Get claims by workflow stage
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsByWorkflowStage(String workflowStage) {
        return claimRepository.findByWorkflowStage(workflowStage);
    }

    /**
     * Get claims ready for employer verification
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsReadyForEmployerVerification() {
        return claimRepository.findClaimsReadyForEmployerVerification();
    }

    /**
     * Get claims ready for tax calculation
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsReadyForTaxCalculation() {
        return claimRepository.findClaimsReadyForTaxCalculation();
    }

    /**
     * Get claims ready for final review
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsReadyForFinalReview() {
        return claimRepository.findClaimsReadyForFinalReview();
    }

    /**
     * Get claims by employer
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsByEmployer(String employerId) {
        return claimRepository.findByEmployerId(employerId);
    }

    /**
     * Get claims with errors
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsWithErrors() {
        return claimRepository.findClaimsWithErrors();
    }

    /**
     * Record processing error for a claim
     */
    public Claim recordClaimError(String claimReferenceId, String errorMessage, String updatedBy) {
        logger.error("Recording error for claim {}: {}", claimReferenceId, errorMessage);
        
        Claim claim = claimRepository.findByClaimReferenceId(claimReferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Claim not found: " + claimReferenceId));
        
        claim.recordError(errorMessage);
        claim.setUpdatedBy(updatedBy);
        claim.addProcessingNote("Error recorded: " + errorMessage);
        
        // If too many errors, mark as error status
        if (claim.getErrorCount() >= 3) {
            claim.updateStatus(Claim.Status.ERROR, "Error - Requires Manual Review", updatedBy);
            claim.addProcessingNote("Claim marked as error due to multiple processing failures");
        }
        
        Claim updatedClaim = claimRepository.save(claim);
        logger.error("Error recorded for claim {}, total error count: {}", claimReferenceId, updatedClaim.getErrorCount());
        
        return updatedClaim;
    }

    /**
     * Add processing note to a claim
     */
    public Claim addProcessingNote(String claimReferenceId, String note, String updatedBy) {
        logger.debug("Adding processing note to claim {}: {}", claimReferenceId, note);
        
        Claim claim = claimRepository.findByClaimReferenceId(claimReferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Claim not found: " + claimReferenceId));
        
        claim.addProcessingNote(note);
        claim.setUpdatedBy(updatedBy);
        
        return claimRepository.save(claim);
    }

    /**
     * Get claims by multiple statuses (useful for workflow queries)
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsByStatuses(List<String> statusCodes) {
        return claimRepository.findByStatusCodeIn(statusCodes);
    }

    /**
     * Get claims for processing (recently updated claims in specific statuses)
     */
    @Transactional(readOnly = true)
    public List<Claim> getClaimsForProcessing(List<String> statusCodes, LocalDateTime since) {
        return claimRepository.findClaimsForProcessing(statusCodes, since);
    }

    /**
     * Get stale claims that haven't been updated recently
     */
    @Transactional(readOnly = true)
    public List<Claim> getStaleClaims(int hoursThreshold) {
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(hoursThreshold);
        return claimRepository.findStaleClaims(cutoffTime);
    }

    /**
     * Get claim statistics by status
     */
    @Transactional(readOnly = true)
    public List<Object[]> getClaimStatsByStatus() {
        return claimRepository.getClaimCountsByStatus();
    }

    /**
     * Get claim statistics by source system
     */
    @Transactional(readOnly = true)
    public List<Object[]> getClaimStatsBySourceSystem() {
        return claimRepository.getClaimCountsBySourceSystem();
    }

    /**
     * Advance claim to next workflow stage based on current status
     */
    public Claim advanceClaimWorkflow(String claimReferenceId, String updatedBy) {
        logger.info("Advancing workflow for claim: {}", claimReferenceId);
        
        Claim claim = claimRepository.findByClaimReferenceId(claimReferenceId)
            .orElseThrow(() -> new IllegalArgumentException("Claim not found: " + claimReferenceId));
        
        String currentStatus = claim.getStatusCode();
        String currentStage = claim.getWorkflowStage();
        
        // Define workflow progression
        switch (currentStatus) {
            case Claim.Status.RECEIVED:
                if (Claim.WorkflowStage.INITIAL.equals(currentStage)) {
                    claim.updateStatus(Claim.Status.AWAITING_EMPLOYER, "Awaiting Employer Information", updatedBy);
                    claim.updateWorkflowStage(Claim.WorkflowStage.EMPLOYER_VERIFICATION, updatedBy);
                    claim.addProcessingNote("Workflow advanced: Ready for employer verification");
                }
                break;
                
            case Claim.Status.AWAITING_EMPLOYER:
                if (Claim.WorkflowStage.EMPLOYER_VERIFICATION.equals(currentStage)) {
                    claim.updateStatus(Claim.Status.AWAITING_TAX_CALC, "Awaiting Tax Calculation", updatedBy);
                    claim.updateWorkflowStage(Claim.WorkflowStage.TAX_CALCULATION, updatedBy);
                    claim.addProcessingNote("Workflow advanced: Ready for tax calculation");
                }
                break;
                
            case Claim.Status.AWAITING_TAX_CALC:
                if (Claim.WorkflowStage.TAX_CALCULATION.equals(currentStage)) {
                    claim.updateWorkflowStage(Claim.WorkflowStage.FINAL_REVIEW, updatedBy);
                    claim.addProcessingNote("Workflow advanced: Ready for final review");
                }
                break;
                
            default:
                logger.warn("Cannot advance workflow for claim {} in status {} and stage {}", 
                    claimReferenceId, currentStatus, currentStage);
                throw new IllegalStateException("Cannot advance workflow from current status: " + currentStatus);
        }
        
	Claim updatedClaim = claimRepository.save(claim);
	logger.info("Successfully advanced workflow for claim {} from {}/{} to {}/{}", 
	    claimReferenceId, currentStatus, currentStage, 
	    updatedClaim.getStatusCode(), updatedClaim.getWorkflowStage());
	    
	// 🔥 ALSO FIXED: Publish status change event when workflow advances
	eventPublisher.publishStatusChanged(claimReferenceId, currentStatus, updatedClaim.getStatusCode(), updatedBy, updatedClaim.getSourceSystem());
	eventPublisher.publishWorkflowAdvanced(claimReferenceId, currentStage, 
	    updatedClaim.getWorkflowStage(), updatedBy, updatedClaim.getSourceSystem());

	return updatedClaim;
    }
}