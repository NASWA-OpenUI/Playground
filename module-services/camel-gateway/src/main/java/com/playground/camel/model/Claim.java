package com.playground.camel.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "claims")
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Claim reference from source system
    @Column(name = "claim_reference_id", nullable = false, unique = true)
    private String claimReferenceId;

    @Column(name = "source_system", nullable = false)
    private String sourceSystem;

    // Claimant Information (standardized format)
    @Column(name = "claimant_id")
    private String claimantId;

    @Column(name = "first_name", nullable = false)
    private String firstName;

    @Column(name = "last_name", nullable = false)
    private String lastName;

    @Column(name = "ssn")
    private String ssn;

    @Column(name = "birth_date")
    private LocalDateTime birthDate;

    // Contact Information
    @Column(name = "email_address")
    private String emailAddress;

    @Column(name = "phone_number")
    private String phoneNumber;

    // Address Information
    @Column(name = "street_address")
    private String streetAddress;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "postal_code")
    private String postalCode;

    // Employment Information
    @Column(name = "employer_name")
    private String employerName;

    @Column(name = "employer_id")
    private String employerId; // EIN

    @Column(name = "employment_start_date")
    private LocalDateTime employmentStartDate;

    @Column(name = "employment_end_date")
    private LocalDateTime employmentEndDate;

    @Column(name = "separation_reason_code")
    private String separationReasonCode;

    @Column(name = "separation_explanation", length = 1000)
    private String separationExplanation;

    // Wage Information
    @Column(name = "base_period_q4", precision = 10, scale = 2)
    private BigDecimal basePeriodQ4;

    @Column(name = "total_annual_earnings", precision = 10, scale = 2)
    private BigDecimal totalAnnualEarnings;

    // Benefit Information (calculated later)
    @Column(name = "weekly_benefit_amount", precision = 10, scale = 2)
    private BigDecimal weeklyBenefitAmount;

    @Column(name = "maximum_benefit_amount", precision = 10, scale = 2)
    private BigDecimal maximumBenefitAmount;

    // Tax Information (added for SOAP tax service integration)
    @Column(name = "state_tax_amount", precision = 10, scale = 2)
    private BigDecimal stateTaxAmount;

    @Column(name = "federal_tax_amount", precision = 10, scale = 2)
    private BigDecimal federalTaxAmount;

    @Column(name = "total_tax_amount", precision = 10, scale = 2)
    private BigDecimal totalTaxAmount;

    @Column(name = "tax_calculation_date")
    private LocalDateTime taxCalculationDate;

    // Status and Workflow
    @Column(name = "status_code", nullable = false)
    private String statusCode;

    @Column(name = "status_display_name")
    private String statusDisplayName;

    @Column(name = "workflow_stage")
    private String workflowStage;

    // System Information
    @Column(name = "received_timestamp", nullable = false)
    private LocalDateTime receivedTimestamp;

    @Column(name = "submission_timestamp")
    private LocalDateTime submissionTimestamp;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    // Processing metadata
    @Column(name = "processing_notes", length = 2000)
    private String processingNotes;

    @Column(name = "error_count")
    private Integer errorCount = 0;

    @Column(name = "last_error_message")
    private String lastErrorMessage;

    // Constructors
    public Claim() {
        this.receivedTimestamp = LocalDateTime.now();
        this.lastUpdated = LocalDateTime.now();
        this.statusCode = "RECEIVED";
        this.statusDisplayName = "Received";
        this.workflowStage = "INITIAL";
    }

    public Claim(String claimReferenceId, String sourceSystem) {
        this();
        this.claimReferenceId = claimReferenceId;
        this.sourceSystem = sourceSystem;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getClaimReferenceId() {
        return claimReferenceId;
    }

    public void setClaimReferenceId(String claimReferenceId) {
        this.claimReferenceId = claimReferenceId;
    }

    public String getSourceSystem() {
        return sourceSystem;
    }

    public void setSourceSystem(String sourceSystem) {
        this.sourceSystem = sourceSystem;
    }

    public String getClaimantId() {
        return claimantId;
    }

    public void setClaimantId(String claimantId) {
        this.claimantId = claimantId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getSsn() {
        return ssn;
    }

    public void setSsn(String ssn) {
        this.ssn = ssn;
    }

    public LocalDateTime getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDateTime birthDate) {
        this.birthDate = birthDate;
    }

    public String getEmailAddress() {
        return emailAddress;
    }

    public void setEmailAddress(String emailAddress) {
        this.emailAddress = emailAddress;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getStreetAddress() {
        return streetAddress;
    }

    public void setStreetAddress(String streetAddress) {
        this.streetAddress = streetAddress;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getEmployerName() {
        return employerName;
    }

    public void setEmployerName(String employerName) {
        this.employerName = employerName;
    }

    public String getEmployerId() {
        return employerId;
    }

    public void setEmployerId(String employerId) {
        this.employerId = employerId;
    }

    public LocalDateTime getEmploymentStartDate() {
        return employmentStartDate;
    }

    public void setEmploymentStartDate(LocalDateTime employmentStartDate) {
        this.employmentStartDate = employmentStartDate;
    }

    public LocalDateTime getEmploymentEndDate() {
        return employmentEndDate;
    }

    public void setEmploymentEndDate(LocalDateTime employmentEndDate) {
        this.employmentEndDate = employmentEndDate;
    }

    public String getSeparationReasonCode() {
        return separationReasonCode;
    }

    public void setSeparationReasonCode(String separationReasonCode) {
        this.separationReasonCode = separationReasonCode;
    }

    public String getSeparationExplanation() {
        return separationExplanation;
    }

    public void setSeparationExplanation(String separationExplanation) {
        this.separationExplanation = separationExplanation;
    }

    public BigDecimal getBasePeriodQ4() {
        return basePeriodQ4;
    }

    public void setBasePeriodQ4(BigDecimal basePeriodQ4) {
        this.basePeriodQ4 = basePeriodQ4;
    }

    public BigDecimal getTotalAnnualEarnings() {
        return totalAnnualEarnings;
    }

    public void setTotalAnnualEarnings(BigDecimal totalAnnualEarnings) {
        this.totalAnnualEarnings = totalAnnualEarnings;
    }

    public BigDecimal getWeeklyBenefitAmount() {
        return weeklyBenefitAmount;
    }

    public void setWeeklyBenefitAmount(BigDecimal weeklyBenefitAmount) {
        this.weeklyBenefitAmount = weeklyBenefitAmount;
    }

    public BigDecimal getMaximumBenefitAmount() {
        return maximumBenefitAmount;
    }

    public void setMaximumBenefitAmount(BigDecimal maximumBenefitAmount) {
        this.maximumBenefitAmount = maximumBenefitAmount;
    }

    // Tax Information getters and setters (ADDED)
    public BigDecimal getStateTaxAmount() {
        return stateTaxAmount;
    }

    public void setStateTaxAmount(BigDecimal stateTaxAmount) {
        this.stateTaxAmount = stateTaxAmount;
    }

    public BigDecimal getFederalTaxAmount() {
        return federalTaxAmount;
    }

    public void setFederalTaxAmount(BigDecimal federalTaxAmount) {
        this.federalTaxAmount = federalTaxAmount;
    }

    public BigDecimal getTotalTaxAmount() {
        return totalTaxAmount;
    }

    public void setTotalTaxAmount(BigDecimal totalTaxAmount) {
        this.totalTaxAmount = totalTaxAmount;
    }

    public LocalDateTime getTaxCalculationDate() {
        return taxCalculationDate;
    }

    public void setTaxCalculationDate(LocalDateTime taxCalculationDate) {
        this.taxCalculationDate = taxCalculationDate;
    }

    public String getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
        this.lastUpdated = LocalDateTime.now();
    }

    public String getStatusDisplayName() {
        return statusDisplayName;
    }

    public void setStatusDisplayName(String statusDisplayName) {
        this.statusDisplayName = statusDisplayName;
    }

    public String getWorkflowStage() {
        return workflowStage;
    }

    public void setWorkflowStage(String workflowStage) {
        this.workflowStage = workflowStage;
    }

    public LocalDateTime getReceivedTimestamp() {
        return receivedTimestamp;
    }

    public void setReceivedTimestamp(LocalDateTime receivedTimestamp) {
        this.receivedTimestamp = receivedTimestamp;
    }

    public LocalDateTime getSubmissionTimestamp() {
        return submissionTimestamp;
    }

    public void setSubmissionTimestamp(LocalDateTime submissionTimestamp) {
        this.submissionTimestamp = submissionTimestamp;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public String getProcessingNotes() {
        return processingNotes;
    }

    public void setProcessingNotes(String processingNotes) {
        this.processingNotes = processingNotes;
    }

    public Integer getErrorCount() {
        return errorCount;
    }

    public void setErrorCount(Integer errorCount) {
        this.errorCount = errorCount;
    }

    public String getLastErrorMessage() {
        return lastErrorMessage;
    }

    public void setLastErrorMessage(String lastErrorMessage) {
        this.lastErrorMessage = lastErrorMessage;
    }

    // Helper methods for status management
    public void updateStatus(String statusCode, String statusDisplayName, String updatedBy) {
        this.statusCode = statusCode;
        this.statusDisplayName = statusDisplayName;
        this.updatedBy = updatedBy;
        this.lastUpdated = LocalDateTime.now();
    }

    public void updateWorkflowStage(String workflowStage, String updatedBy) {
        this.workflowStage = workflowStage;
        this.updatedBy = updatedBy;
        this.lastUpdated = LocalDateTime.now();
    }

    public void addProcessingNote(String note) {
        if (this.processingNotes == null) {
            this.processingNotes = note;
        } else {
            this.processingNotes += "\n" + LocalDateTime.now() + ": " + note;
        }
        this.lastUpdated = LocalDateTime.now();
    }

    public void recordError(String errorMessage) {
        this.errorCount = (this.errorCount == null ? 0 : this.errorCount) + 1;
        this.lastErrorMessage = errorMessage;
        this.lastUpdated = LocalDateTime.now();
    }

    public boolean isInStatus(String... statusCodes) {
        for (String status : statusCodes) {
            if (status.equals(this.statusCode)) {
                return true;
            }
        }
        return false;
    }

    // Standard workflow status constants
    public static class Status {
        public static final String RECEIVED = "RECEIVED";
        public static final String AWAITING_EMPLOYER = "AWAITING_EMPLOYER";
        public static final String AWAITING_TAX_CALC = "AWAITING_TAX_CALC";
        public static final String APPROVED = "APPROVED";
        public static final String DENIED = "DENIED";
        public static final String ERROR = "ERROR";
    }

    public static class WorkflowStage {
        public static final String INITIAL = "INITIAL";
        public static final String EMPLOYER_VERIFICATION = "EMPLOYER_VERIFICATION";
        public static final String TAX_CALCULATION = "TAX_CALCULATION";
        public static final String FINAL_REVIEW = "FINAL_REVIEW";
        public static final String COMPLETED = "COMPLETED";
    }
}
