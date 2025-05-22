package com.playground.camel.events;

import java.time.LocalDateTime;

public class ClaimEvent {
    private String eventType;
    private String claimReferenceId;
    private String previousStatus;
    private String newStatus;
    private String previousWorkflowStage;
    private String newWorkflowStage;
    private String updatedBy;
    private String sourceSystem;
    private LocalDateTime timestamp;
    private String notes;

    // Constructors
    public ClaimEvent() {
        this.timestamp = LocalDateTime.now();
    }

    public ClaimEvent(String eventType, String claimReferenceId, String sourceSystem) {
        this();
        this.eventType = eventType;
        this.claimReferenceId = claimReferenceId;
        this.sourceSystem = sourceSystem;
    }

    // Static factory methods for common events
    public static ClaimEvent statusChanged(String claimReferenceId, String previousStatus, 
                                         String newStatus, String updatedBy, String sourceSystem) {
        ClaimEvent event = new ClaimEvent("CLAIM_STATUS_CHANGED", claimReferenceId, sourceSystem);
        event.setPreviousStatus(previousStatus);
        event.setNewStatus(newStatus);
        event.setUpdatedBy(updatedBy);
        return event;
    }

    public static ClaimEvent workflowAdvanced(String claimReferenceId, String previousStage, 
                                            String newStage, String updatedBy, String sourceSystem) {
        ClaimEvent event = new ClaimEvent("CLAIM_WORKFLOW_ADVANCED", claimReferenceId, sourceSystem);
        event.setPreviousWorkflowStage(previousStage);
        event.setNewWorkflowStage(newStage);
        event.setUpdatedBy(updatedBy);
        return event;
    }

    public static ClaimEvent claimReceived(String claimReferenceId, String sourceSystem) {
        return new ClaimEvent("CLAIM_RECEIVED", claimReferenceId, sourceSystem);
    }

    // Getters and setters
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getClaimReferenceId() { return claimReferenceId; }
    public void setClaimReferenceId(String claimReferenceId) { this.claimReferenceId = claimReferenceId; }

    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }

    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }

    public String getPreviousWorkflowStage() { return previousWorkflowStage; }
    public void setPreviousWorkflowStage(String previousWorkflowStage) { this.previousWorkflowStage = previousWorkflowStage; }

    public String getNewWorkflowStage() { return newWorkflowStage; }
    public void setNewWorkflowStage(String newWorkflowStage) { this.newWorkflowStage = newWorkflowStage; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public String getSourceSystem() { return sourceSystem; }
    public void setSourceSystem(String sourceSystem) { this.sourceSystem = sourceSystem; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}