// claims-processing/src/services/event-bus-service.js
const axios = require('axios');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';

/**
 * Service for interacting with the event bus
 */
const eventBusService = {
  /**
   * Publish an event to the event bus
   * @param {string} eventName - Name of the event
   * @param {object} data - Event data
   * @returns {Promise} - Promise resolving to the publish result
   */
  publishEvent: async (eventName, data) => {
    try {
      console.log(`[EVENT BUS] Publishing event: ${eventName}`);
      const response = await axios.post(`${API_GATEWAY_URL}/api/events/publish`, {
        eventName,
        data
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error publishing event ${eventName}:`, error);
      throw error;
    }
  },
  
  /**
   * Subscribe to events from the event bus
   * @returns {Promise} - Promise resolving when subscribed
   */
  subscribeToEvents: async () => {
    try {
      // Subscribe to employer verification events
      await axios.post(`${API_GATEWAY_URL}/api/events/subscribe`, {
        eventName: 'employer.verified',
        callbackUrl: 'http://localhost:3002/api/employer/verification-callback'
      });
      
      // Subscribe to benefit calculation events
      await axios.post(`${API_GATEWAY_URL}/api/events/subscribe`, {
        eventName: 'benefit.calculated',
        callbackUrl: 'http://localhost:3002/api/benefits/calculation-callback'
      });
      
      // Subscribe to payment processed events
      await axios.post(`${API_GATEWAY_URL}/api/events/subscribe`, {
        eventName: 'payment.processed',
        callbackUrl: 'http://localhost:3002/api/benefits/payment-callback'
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error subscribing to events:', error);
      throw error;
    }
  }
};

module.exports = eventBusService;