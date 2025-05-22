package com.playground.camel.repository;

import com.playground.camel.model.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimRepository extends JpaRepository<Claim, Long> {
    
    // Find by claim reference ID (unique identifier from source system)
    Optional<Claim> findByClaimReferenceId(String claimReferenceId);
    
    // Find by source system
    List<Claim> findBySourceSystem(String sourceSystem);
    
    // Find by status
    List<Claim> findByStatusCode(String statusCode);
    
    // Find by workflow stage
    List<Claim> findByWorkflowStage(String workflowStage);
    
    // Find by claimant
    List<Claim> findByClaimantId(String claimantId);
    List<Claim> findByFirstNameAndLastName(String firstName, String lastName);
    
    // Find by employer
    List<Claim> findByEmployerId(String employerId);
    List<Claim> findByEmployerName(String employerName);
    
    // Find claims in multiple statuses (useful for workflow queries)
    @Query("SELECT c FROM Claim c WHERE c.statusCode IN :statusCodes")
    List<Claim> findByStatusCodeIn(@Param("statusCodes") List<String> statusCodes);
    
    // Find claims ready for specific processing stages
    @Query("SELECT c FROM Claim c WHERE c.statusCode = 'RECEIVED' AND c.workflowStage = 'INITIAL'")
    List<Claim> findClaimsReadyForEmployerVerification();
    
    @Query("SELECT c FROM Claim c WHERE c.statusCode = 'AWAITING_EMPLOYER' AND c.workflowStage = 'EMPLOYER_VERIFICATION'")
    List<Claim> findClaimsReadyForTaxCalculation();
    
    @Query("SELECT c FROM Claim c WHERE c.statusCode = 'AWAITING_TAX_CALC' AND c.workflowStage = 'TAX_CALCULATION'")
    List<Claim> findClaimsReadyForFinalReview();
    
    // Find claims with errors that need attention
    @Query("SELECT c FROM Claim c WHERE c.errorCount > 0 OR c.statusCode = 'ERROR'")
    List<Claim> findClaimsWithErrors();
    
    // Find claims by date ranges
    List<Claim> findByReceivedTimestampBetween(LocalDateTime startDate, LocalDateTime endDate);
    List<Claim> findBySubmissionTimestampBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find stale claims (haven't been updated in a while)
    @Query("SELECT c FROM Claim c WHERE c.lastUpdated < :cutoffTime AND c.statusCode NOT IN ('APPROVED', 'DENIED')")
    List<Claim> findStaleClaims(@Param("cutoffTime") LocalDateTime cutoffTime);
    
    // Statistics queries
    @Query("SELECT COUNT(c) FROM Claim c WHERE c.statusCode = :statusCode")
    long countByStatusCode(@Param("statusCode") String statusCode);
    
    @Query("SELECT c.statusCode, COUNT(c) FROM Claim c GROUP BY c.statusCode")
    List<Object[]> getClaimCountsByStatus();
    
    @Query("SELECT c.sourceSystem, COUNT(c) FROM Claim c GROUP BY c.sourceSystem")
    List<Object[]> getClaimCountsBySourceSystem();
    
    // Performance queries for high-volume scenarios
    @Query(value = "SELECT * FROM claims WHERE status_code = ?1 ORDER BY received_timestamp ASC LIMIT ?2", nativeQuery = true)
    List<Claim> findTopClaimsByStatusOrderByReceivedTimestamp(String statusCode, int limit);
    
    // Check if claim exists (efficient existence check)
    boolean existsByClaimReferenceId(String claimReferenceId);
    
    // Find claims for specific processing windows
    @Query("SELECT c FROM Claim c WHERE c.statusCode IN :statusCodes AND c.lastUpdated >= :since ORDER BY c.receivedTimestamp ASC")
    List<Claim> findClaimsForProcessing(@Param("statusCodes") List<String> statusCodes, @Param("since") LocalDateTime since);
}