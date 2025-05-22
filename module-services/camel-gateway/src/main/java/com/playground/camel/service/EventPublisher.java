package com.playground.camel.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.playground.camel.events.ClaimEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EventPublisher {

    private static final Logger logger = LoggerFactory.getLogger(EventPublisher.class);

    @Autowired
    private JmsTemplate jmsTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    private static final String CLAIM_EVENTS_TOPIC = "claim.events";

    public void publishClaimEvent(ClaimEvent event) {
        try {
            String eventJson = objectMapper.writeValueAsString(event);
            jmsTemplate.convertAndSend(CLAIM_EVENTS_TOPIC, eventJson);
            
            logger.info("📡 Published event: {} for claim: {}", 
                event.getEventType(), event.getClaimReferenceId());
                
        } catch (Exception e) {
            logger.error("❌ Failed to publish event for claim: {}", 
                event.getClaimReferenceId(), e);
        }
    }

    public void publishClaimReceived(String claimReferenceId, String sourceSystem) {
        ClaimEvent event = ClaimEvent.claimReceived(claimReferenceId, sourceSystem);
        publishClaimEvent(event);
    }

    public void publishStatusChanged(String claimReferenceId, String previousStatus, 
                                   String newStatus, String updatedBy, String sourceSystem) {
        ClaimEvent event = ClaimEvent.statusChanged(claimReferenceId, previousStatus, 
            newStatus, updatedBy, sourceSystem);
        publishClaimEvent(event);
    }

    public void publishWorkflowAdvanced(String claimReferenceId, String previousStage, 
                                      String newStage, String updatedBy, String sourceSystem) {
        ClaimEvent event = ClaimEvent.workflowAdvanced(claimReferenceId, previousStage, 
            newStage, updatedBy, sourceSystem);
        publishClaimEvent(event);
    }
}