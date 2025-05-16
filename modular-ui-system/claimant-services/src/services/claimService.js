// claimant-services/src/services/claimService.js
import axios from 'axios';

// Base API URL - would come from environment variables in a real app
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create a pre-configured axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Submit a new unemployment claim
 * @param {Object} claimData - Claim form data
 * @returns {Promise} - Promise resolving to the created claim
 */
export const submitClaim = async (claimData) => {
  try {
    const response = await apiClient.post('/claims', claimData);
    return response.data;
  } catch (error) {
    console.error('Error submitting claim:', error);
    throw new Error(
      error.response?.data?.error || 
      'An error occurred while submitting your claim. Please try again.'
    );
  }
};

/**
 * Get status of a specific claim
 * @param {string} claimId - Claim ID
 * @returns {Promise} - Promise resolving to the claim status
 */
export const getClaimStatus = async (claimId) => {
  try {
    const response = await apiClient.get(`/claims/${claimId}/status`);
    return response.data;
  } catch (error) {
    console.error('Error getting claim status:', error);
    throw new Error(
      error.response?.data?.error || 
      'An error occurred while retrieving claim status. Please try again.'
    );
  }
};

/**
 * Get all claims for the current user
 * @returns {Promise} - Promise resolving to an array of claims
 */
export const getAllClaims = async () => {
  try {
    const response = await apiClient.get('/claims');
    return response.data;
  } catch (error) {
    console.error('Error getting claims:', error);
    throw new Error(
      error.response?.data?.error || 
      'An error occurred while retrieving your claims. Please try again.'
    );
  }
};

/**
 * Submit a weekly certification
 * @param {string} claimId - Claim ID
 * @param {Object} certificationData - Weekly certification data
 * @returns {Promise} - Promise resolving to the certification result
 */
export const submitWeeklyCertification = async (claimId, certificationData) => {
  try {
    const response = await apiClient.post(`/claims/${claimId}/certify`, certificationData);
    return response.data;
  } catch (error) {
    console.error('Error submitting certification:', error);
    throw new Error(
      error.response?.data?.error || 
      'An error occurred while submitting your certification. Please try again.'
    );
  }
};

/**
 * Get payment history for a claim
 * @param {string} claimId - Claim ID
 * @returns {Promise} - Promise resolving to the payment history
 */
export const getPaymentHistory = async (claimId) => {
  try {
    const response = await apiClient.get(`/benefits/payment-history/${claimId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting payment history:', error);
    throw new Error(
      error.response?.data?.error || 
      'An error occurred while retrieving payment history. Please try again.'
    );
  }
};

// Add an interceptor for mock data (temporary, remove in production)
// This is just for demonstration purposes
apiClient.interceptors.response.use(
  response => response,
  error => {
    // If in development and API is not available, return mock data
    if (process.env.NODE_ENV === 'development' && error.message.includes('Network Error')) {
      console.warn('Using mock data due to API unavailability');
      
      const { method, url } = error.config;
      
      if (method === 'get' && url.includes('/claims')) {
        // Mock claims list
        return Promise.resolve({
          data: [
            {
              claimId: 'C1001',
              claimantName: 'John Doe',
              ssn: 'XXX-XX-1234',
              lastEmployer: 'Acme Corporation',
              employmentDates: '2022-01-15 - 2023-05-31',
              weeklyWage: 1000,
              status: 'Approved',
              weeklyBenefit: 500,
              maxBenefit: 13000,
              createdAt: '2023-06-01T12:00:00Z',
              updatedAt: '2023-06-03T15:30:00Z'
            },
            {
              claimId: 'C982',
              claimantName: 'John Doe',
              ssn: 'XXX-XX-1234',
              lastEmployer: 'TechStartup Inc',
              employmentDates: '2021-03-10 - 2022-01-10',
              weeklyWage: 1200,
              status: 'Expired',
              weeklyBenefit: 600,
              maxBenefit: 15600,
              createdAt: '2022-01-15T09:45:00Z',
              updatedAt: '2022-07-10T16:20:00Z'
            }
          ]
        });
      }
      
      if (method === 'get' && url.includes('/status')) {
        // Mock claim status
        return Promise.resolve({
          data: {
            claimId: 'C1001',
            status: 'Approved',
            weeklyBenefit: 500,
            maxBenefit: 13000,
            lastUpdated: new Date().toISOString()
          }
        });
      }
      
      if (method === 'post' && url.includes('/claims')) {
        // Mock submit claim response
        const claimData = JSON.parse(error.config.data);
        return Promise.resolve({
          data: {
            message: 'Claim created successfully',
            claim: {
              claimId: 'C1002',
              claimantName: claimData.claimantName,
              lastEmployer: claimData.lastEmployer,
              employmentDates: claimData.employmentDates,
              weeklyWage: claimData.weeklyWage,
              status: 'Processing',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          }
        });
      }
      
      if (method === 'post' && url.includes('/certify')) {
        // Mock certification response
        return Promise.resolve({
          data: {
            message: 'Certification submitted successfully',
            certification: {
              weekEnding: JSON.parse(error.config.data).weekEnding,
              status: 'Approved',
              paymentAmount: 500,
              paymentDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
            }
          }
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default {
  submitClaim,
  getClaimStatus,
  getAllClaims,
  submitWeeklyCertification,
  getPaymentHistory
};