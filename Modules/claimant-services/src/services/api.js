// Modules/claimant-services/src/services/api.js
import axios from 'axios';

// Get the API base URL from environment variables, or default to the Kong gateway
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const CLAIMS_API = `${API_BASE_URL}/api/claims`;

// Helper function to handle API errors
const handleError = (error) => {
  console.error('API Error:', error);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    throw new Error(error.response.data.message || 'Server error');
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('No response from server. Please try again later.');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error('Error setting up request. Please try again.');
  }
};

// Get all claims for the current user
export const getClaims = async () => {
  try {
    const response = await axios.get(`${CLAIMS_API}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Submit a new claim
export const submitClaim = async (claimData) => {
  try {
    const response = await axios.post(`${CLAIMS_API}`, claimData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Get status of a specific claim
export const getClaimStatus = async (claimId) => {
  try {
    const response = await axios.get(`${CLAIMS_API}/${claimId}/status`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};
