package com.playground.camel.controller;

import com.playground.camel.model.Claim;
import com.playground.camel.service.ClaimService;
import org.apache.camel.ProducerTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/claims")
@CrossOrigin(origins = "*")
public class ClaimsController {

    private static final Logger logger = LoggerFactory.getLogger(ClaimsController.class);

    @Autowired
    private ClaimService claimService;

    @Autowired
    private ProducerTemplate producerTemplate;

    /**
     * Get all claims
     */
    @GetMapping
    public ResponseEntity<List<Claim>> getAllClaims() {
        logger.info("📋 Fetching all claims");
        try {
            List<Claim> claims = claimService.getAllClaims();
            logger.info("✅ Retrieved {} claims", claims.size());
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            logger.error("❌ Error fetching all claims", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get claim by reference ID
     */
    @GetMapping("/{claimReferenceId}")
    public ResponseEntity<Claim> getClaimByReferenceId(@PathVariable String claimReferenceId) {
        logger.info("🔍 Fetching claim: {}", claimReferenceId);
        try {
            Optional<Claim> claim = claimService.getClaimByReferenceId(claimReferenceId);
            if (claim.isPresent()) {
                logger.info("✅ Found claim: {}", claimReferenceId);
                return ResponseEntity.ok(claim.get());
            } else {
                logger.warn("⚠️ Claim not found: {}", claimReferenceId);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("❌ Error fetching claim: {}", claimReferenceId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get claims by status
     */
    @GetMapping("/status/{statusCode}")
    public ResponseEntity<List<Claim>> getClaimsByStatus(@PathVariable String statusCode) {
        logger.info("🔍 Fetching claims with status: {}", statusCode);
        try {
            List<Claim> claims = claimService.getClaimsByStatus(statusCode);
            logger.info("✅ Found {} claims with status: {}", claims.size(), statusCode);
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            logger.error("❌ Error fetching claims by status: {}", statusCode, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get claims by workflow stage
     */
    @GetMapping("/workflow/{workflowStage}")
    public ResponseEntity<List<Claim>> getClaimsByWorkflowStage(@PathVariable String workflowStage) {
        logger.info("🔍 Fetching claims in workflow stage: {}", workflowStage);
        try {
            List<Claim> claims = claimService.getClaimsByWorkflowStage(workflowStage);
            logger.info("✅ Found {} claims in workflow stage: {}", claims.size(), workflowStage);
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            logger.error("❌ Error fetching claims by workflow stage: {}", workflowStage, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get claims ready for employer verification
     */
    @GetMapping("/ready/employer-verification")
    public ResponseEntity<List<Claim>> getClaimsReadyForEmployerVerification() {
        logger.info("🔍 Fetching claims ready for employer verification");
        try {
            List<Claim> claims = claimService.getClaimsReadyForEmployerVerification();
            logger.info("✅ Found {} claims ready for employer verification", claims.size());
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            logger.error("❌ Error fetching claims ready for employer verification", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get claims ready for tax calculation
     */
    @GetMapping("/ready/tax-calculation")
    public ResponseEntity<List<Claim>> getClaimsReadyForTaxCalculation() {
        logger.info("🔍 Fetching claims ready for tax calculation");
        try {
            List<Claim> claims = claimService.getClaimsReadyForTaxCalculation();
            logger.info("✅ Found {} claims ready for tax calculation", claims.size());
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            logger.error("❌ Error fetching claims ready for tax calculation", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get claims ready for final review
     */
    @GetMapping("/ready/final-review")
    public ResponseEntity<List<Claim>> getClaimsReadyForFinalReview() {
        logger.info("🔍 Fetching claims ready for final review");
        try {
            List<Claim> claims = claimService.getClaimsReadyForFinalReview();
            logger.info("✅ Found {} claims ready for final review", claims.size());
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            logger.error("❌ Error fetching claims ready for final review", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get claims by employer
     */
    @GetMapping("/employer/{employerId}")
    public ResponseEntity<List<Claim>> getClaimsByEmployer(@PathVariable String employerId) {
        logger.info("🔍 Fetching claims for employer: {}", employerId);
        try {
            List<Claim> claims = claimService.getClaimsByEmployer(employerId);
            logger.info("✅ Found {} claims for employer: {}", claims.size(), employerId);
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            logger.error("❌ Error fetching claims for employer: {}", employerId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get claims with errors
     */
    @GetMapping("/errors")
    public ResponseEntity<List<Claim>> getClaimsWithErrors() {
        logger.info("🔍 Fetching claims with errors");
        try {
            List<Claim> claims = claimService.getClaimsWithErrors();
            logger.info("✅ Found {} claims with errors", claims.size());
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            logger.error("❌ Error fetching claims with errors", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Update claim status
     */
    @PutMapping("/{claimReferenceId}/status")
    public ResponseEntity<Claim> updateClaimStatus(
            @PathVariable String claimReferenceId,
            @RequestBody Map<String, String> updateRequest) {
        
        String statusCode = updateRequest.get("statusCode");
        String statusDisplayName = updateRequest.get("statusDisplayName");
        String updatedBy = updateRequest.getOrDefault("updatedBy", "api");
        String notes = updateRequest.get("notes");
        
        logger.info("📝 Updating claim {} status to: {}", claimReferenceId, statusCode);
        
        try {
            Claim updatedClaim = claimService.updateClaimStatus(claimReferenceId, statusCode, statusDisplayName, updatedBy, notes);
            logger.info("✅ Successfully updated claim {} status to: {}", claimReferenceId, statusCode);
            return ResponseEntity.ok(updatedClaim);
        } catch (IllegalArgumentException e) {
            logger.warn("⚠️ Claim not found: {}", claimReferenceId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("❌ Error updating claim status: {}", claimReferenceId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Update workflow stage
     */
    @PutMapping("/{claimReferenceId}/workflow")
    public ResponseEntity<Claim> updateWorkflowStage(
            @PathVariable String claimReferenceId,
            @RequestBody Map<String, String> updateRequest) {
        
        String workflowStage = updateRequest.get("workflowStage");
        String updatedBy = updateRequest.getOrDefault("updatedBy", "api");
        String notes = updateRequest.get("notes");
        
        logger.info("⚡ Updating claim {} workflow stage to: {}", claimReferenceId, workflowStage);
        
        try {
            Claim updatedClaim = claimService.updateWorkflowStage(claimReferenceId, workflowStage, updatedBy, notes);
            logger.info("✅ Successfully updated claim {} workflow stage to: {}", claimReferenceId, workflowStage);
            return ResponseEntity.ok(updatedClaim);
        } catch (IllegalArgumentException e) {
            logger.warn("⚠️ Claim not found: {}", claimReferenceId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("❌ Error updating workflow stage: {}", claimReferenceId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Advance claim workflow to next stage
     */
    @PostMapping("/{claimReferenceId}/advance")
    public ResponseEntity<Claim> advanceClaimWorkflow(
            @PathVariable String claimReferenceId,
            @RequestBody(required = false) Map<String, String> requestBody) {
        
        String updatedBy = (requestBody != null) ? requestBody.getOrDefault("updatedBy", "api") : "api";
        
        logger.info("⚡ Advancing workflow for claim: {}", claimReferenceId);
        
        try {
            Claim updatedClaim = claimService.advanceClaimWorkflow(claimReferenceId, updatedBy);
            logger.info("✅ Successfully advanced workflow for claim: {}", claimReferenceId);
            return ResponseEntity.ok(updatedClaim);
        } catch (IllegalArgumentException e) {
            logger.warn("⚠️ Claim not found: {}", claimReferenceId);
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            logger.warn("⚠️ Cannot advance workflow for claim {}: {}", claimReferenceId, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("❌ Error advancing workflow for claim: {}", claimReferenceId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Record processing error for a claim
     */
    @PostMapping("/{claimReferenceId}/error")
    public ResponseEntity<Claim> recordClaimError(
            @PathVariable String claimReferenceId,
            @RequestBody Map<String, String> errorRequest) {
        
        String errorMessage = errorRequest.get("errorMessage");
        String updatedBy = errorRequest.getOrDefault("updatedBy", "api");
        
        logger.info("❌ Recording error for claim: {}", claimReferenceId);
        
        try {
            Claim updatedClaim = claimService.recordClaimError(claimReferenceId, errorMessage, updatedBy);
            logger.info("✅ Successfully recorded error for claim: {}", claimReferenceId);
            return ResponseEntity.ok(updatedClaim);
        } catch (IllegalArgumentException e) {
            logger.warn("⚠️ Claim not found: {}", claimReferenceId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("❌ Error recording claim error: {}", claimReferenceId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Add processing note to a claim
     */
    @PostMapping("/{claimReferenceId}/note")
    public ResponseEntity<Claim> addProcessingNote(
            @PathVariable String claimReferenceId,
            @RequestBody Map<String, String> noteRequest) {
        
        String note = noteRequest.get("note");
        String updatedBy = noteRequest.getOrDefault("updatedBy", "api");
        
        logger.info("📝 Adding note to claim: {}", claimReferenceId);
        
        try {
            Claim updatedClaim = claimService.addProcessingNote(claimReferenceId, note, updatedBy);
            logger.info("✅ Successfully added note to claim: {}", claimReferenceId);
            return ResponseEntity.ok(updatedClaim);
        } catch (IllegalArgumentException e) {
            logger.warn("⚠️ Claim not found: {}", claimReferenceId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("❌ Error adding note to claim: {}", claimReferenceId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get claim statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getClaimStatistics() {
        logger.info("📊 Fetching claim statistics");
        try {
            Map<String, Object> stats = new HashMap<>();
            
            // Get counts by status
            List<Object[]> statusStats = claimService.getClaimStatsByStatus();
            Map<String, Long> statusCounts = new HashMap<>();
            for (Object[] row : statusStats) {
                statusCounts.put((String) row[0], (Long) row[1]);
            }
            stats.put("statusCounts", statusCounts);
            
            // Get counts by source system
            List<Object[]> sourceStats = claimService.getClaimStatsBySourceSystem();
            Map<String, Long> sourceCounts = new HashMap<>();
            for (Object[] row : sourceStats) {
                sourceCounts.put((String) row[0], (Long) row[1]);
            }
            stats.put("sourceCounts", sourceCounts);
            
            // Add timestamp
            stats.put("timestamp", LocalDateTime.now());
            
            logger.info("✅ Generated claim statistics");
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("❌ Error generating claim statistics", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get claims for processing (multiple statuses)
     */
    @PostMapping("/processing")
    public ResponseEntity<List<Claim>> getClaimsForProcessing(@RequestBody Map<String, Object> request) {
        logger.info("🔍 Fetching claims for processing");
        try {
            @SuppressWarnings("unchecked")
            List<String> statusCodes = (List<String>) request.get("statusCodes");
            Integer hoursBack = (Integer) request.getOrDefault("hoursBack", 24);
            
            LocalDateTime since = LocalDateTime.now().minusHours(hoursBack);
            List<Claim> claims = claimService.getClaimsForProcessing(statusCodes, since);
            
            logger.info("✅ Found {} claims for processing", claims.size());
            return ResponseEntity.ok(claims);
        } catch (Exception e) {
            logger.error("❌ Error fetching claims for processing", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get stale claims (haven't been updated recently)
     */
    @GetMapping("/stale")
    public ResponseEntity<List<Claim>> getStaleClaims(@RequestParam(defaultValue = "48") int hoursThreshold) {
        logger.info("🔍 Fetching stale claims (older than {} hours)", hoursThreshold);
        try {
            List<Claim> staleClaims = claimService.getStaleClaims(hoursThreshold);
            logger.info("✅ Found {} stale claims", staleClaims.size());
            return ResponseEntity.ok(staleClaims);
        } catch (Exception e) {
            logger.error("❌ Error fetching stale claims", e);
            return ResponseEntity.status(500).build();
        }
    }
}