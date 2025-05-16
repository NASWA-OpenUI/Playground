// claims-processing/src/services/benefits-service.js
const axios = require('axios');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const BENEFITS_SERVICE_URL = process.env.BENEFITS_SERVICE_URL || 'localhost:3004';

/**
 * Service for interacting with the Benefits Administration service
 */
const benefitsService = {
  /**
   * Process payment through the Benefits Administration service
   * @param {string} claimId - Claim ID
   * @param {number} amount - Payment amount
   * @returns {Promise} - Promise resolving to the payment result
   */
  processPayment: async (claimId, amount) => {
    try {
      console.log(`[BENEFITS SERVICE] Processing payment for claim ${claimId}`);
      
      // Option 1: Direct gRPC call
      // Uncomment to use direct gRPC call instead of API Gateway
      /*
      const packageDefinition = protoLoader.loadSync(
        '../../benefits-administration/src/Protos/benefits.proto',
        {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true
        }
      );
      
      const benefitsProto = grpc.loadPackageDefinition(packageDefinition).benefits;
      
      // Create gRPC client
      const client = new benefitsProto.BenefitsService(
        BENEFITS_SERVICE_URL,
        grpc.credentials.createInsecure()
      );
      
      // Make gRPC call and convert to Promise
      return new Promise((resolve, reject) => {
        client.processPayment({ claimId, amount }, (error, response) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(response);
        });
      });
      */
      
      // Option 2: API Gateway call (recommended for abstraction)
      const response = await axios.post(`${API_GATEWAY_URL}/api/benefits/process-payment`, {
        claimId,
        amount
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error processing payment for claim ${claimId}:`, error);
      throw error;
    }
  },
  
  /**
   * Get payment history for a claim
   * @param {string} claimId - Claim ID
   * @returns {Promise} - Promise resolving to the payment history
   */
  getPaymentHistory: async (claimId) => {
    try {
      console.log(`[BENEFITS SERVICE] Getting payment history for claim ${claimId}`);
      
      // Use API Gateway to proxy the request
      const response = await axios.get(`${API_GATEWAY_URL}/api/benefits/payment-history/${claimId}`);
      
      return response.data;
    } catch (error) {
      console.error(`Error getting payment history for claim ${claimId}:`, error);
      throw error;
    }
  }
};

module.exports = benefitsService;