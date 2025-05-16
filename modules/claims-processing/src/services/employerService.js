// Modules/claims-processing/src/services/employerService.js
const axios = require('axios');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';
const EMPLOYER_SERVICE_URL = `${API_GATEWAY_URL}/api/employers`;

// Request verification from employer
exports.requestVerification = async (verificationRequest) => {
  try {
    // For demo purposes, mock a successful request without actually calling employer service
    console.log('Employer verification request:', verificationRequest);
    
    // In a real implementation, you would call the employer service
    // const response = await axios.post(`${EMPLOYER_SERVICE_URL}/verification-requests`, verificationRequest);
    // return response.data;
    
    return {
      requestId: 'VR' + Math.floor(100000 + Math.random() * 900000),
      status: 'Pending',
      message: 'Verification request submitted successfully.'
    };
  } catch (error) {
    console.error('Error requesting employer verification:', error);
    throw new Error('Failed to request employer verification');
  }
};

// Get verification status
exports.getVerificationStatus = async (requestId) => {
  try {
    // For demo purposes, mock a response
    return {
      requestId,
      status: 'Completed',
      completionDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting verification status:', error);
    throw new Error('Failed to get verification status');
  }
};
