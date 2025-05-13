import axios from 'axios';

// Base URL for our API gateway (Kong)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API methods
export const claimsAPI = {
  // Submit a new claim
  submitClaim: async (claimData) => {
    try {
      const response = await api.post('/claims/api/new-claim', {
        claimantName: claimData.fullName,
        ssnLast4: claimData.ssnLast4,
        phone: claimData.phone,
        email: claimData.email,
        employerName: claimData.lastEmployerName,
        separationDate: claimData.employmentEndDate,
        separationReason: claimData.separationReason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to submit claim');
    }
  },

  // Get claim by ID
  getClaim: async (claimId) => {
    try {
      const response = await api.get(`/claims/api/claim/${claimId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch claim');
    }
  },

  // Get all claims (for demo/admin view)
  getAllClaims: async () => {
    try {
      const response = await api.get('/claims/api/claims');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch claims');
    }
  }
};

export default api;