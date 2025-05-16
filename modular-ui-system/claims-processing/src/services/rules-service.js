// claims-processing/src/services/rules-service.js
const axios = require('axios');
const soap = require('soap');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const RULES_ENGINE_URL = process.env.RULES_ENGINE_URL || 'http://localhost:3001/soap/rules?wsdl';

/**
 * Service for interacting with the Business Rules Engine
 */
const rulesService = {
  /**
   * Calculate benefit using the Business Rules Engine
   * @param {string} claimId - Claim ID
   * @param {number} weeklyWage - Weekly wage
   * @returns {Promise} - Promise resolving to the benefit calculation
   */
  calculateBenefit: async (claimId, weeklyWage) => {
    try {
      console.log(`[RULES SERVICE] Calculating benefit for claim ${claimId}`);
      
      // Option 1: Direct SOAP call
      // Uncomment to use direct SOAP call instead of API Gateway
      /*
      const client = await soap.createClientAsync(RULES_ENGINE_URL);
      const result = await client.calculateBenefitAsync({
        claimId,
        weeklyWage,
        taxRate: 0.22 // Use default tax rate
      });
      return result[0];
      */
      
      // Option 2: API Gateway call (recommended for abstraction)
      const response = await axios.post(`${API_GATEWAY_URL}/api/rules/calculate-benefit`, {
        claimId,
        weeklyWage,
        taxRate: 0.22 // Use default tax rate
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error calculating benefit for claim ${claimId}:`, error);
      throw error;
    }
  },
  
  /**
   * Determine eligibility using the Business Rules Engine
   * @param {string} claimId - Claim ID
   * @param {number} weeksWorked - Weeks worked
   * @param {number} totalEarnings - Total earnings
   * @returns {Promise} - Promise resolving to the eligibility determination
   */
  determineEligibility: async (claimId, weeksWorked, totalEarnings) => {
    try {
      console.log(`[RULES SERVICE] Determining eligibility for claim ${claimId}`);
      
      // Create SOAP client
      const client = await soap.createClientAsync(RULES_ENGINE_URL);
      
      // Call determine eligibility method
      const result = await client.determineEligibilityAsync({
        claimId,
        weeksWorked,
        totalEarnings
      });
      
      return result[0];
    } catch (error) {
      console.error(`Error determining eligibility for claim ${claimId}:`, error);
      throw error;
    }
  }
};

module.exports = rulesService;