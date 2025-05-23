import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // Dashboard
  getDashboardData: () => axios.get(`${API_BASE}/dashboard`),
  
  // Claims
  getPendingClaims: () => axios.get(`${API_BASE}/claims/pending`),
  getClaim: (claimId) => axios.get(`${API_BASE}/claims/${claimId}`),
  submitVerification: (claimId, data) => axios.post(`${API_BASE}/claims/${claimId}/verify`, data),
  
  // Health
  getHealth: () => axios.get(`${API_BASE}/health`)
};

// Response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);