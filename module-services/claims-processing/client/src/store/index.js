import { createStore } from 'vuex'
import axios from 'axios'

export default createStore({
  state: {
    claims: [],
    currentClaim: null,
    loading: false,
    error: null
  },
  getters: {
    getClaims: state => state.claims,
    getCurrentClaim: state => state.currentClaim,
    isLoading: state => state.loading,
    getError: state => state.error
  },
  mutations: {
    SET_CLAIMS(state, claims) {
      state.claims = claims
    },
    SET_CURRENT_CLAIM(state, claim) {
      state.currentClaim = claim
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    UPDATE_CLAIM_STATUS(state, { claimId, status }) {
      // Update claim in the list
      const claim = state.claims.find(c => c.claim_reference_id === claimId)
      if (claim) {
        claim.claim_status = status
      }
      
      // Update current claim if it's the same one
      if (state.currentClaim && state.currentClaim.claim_reference_id === claimId) {
        state.currentClaim.claim_status = status
      }
    }
  },
  actions: {
    async fetchClaims({ commit }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get('/api/claims')
        commit('SET_CLAIMS', response.data)
      } catch (error) {
        console.error('Error fetching claims:', error)
        commit('SET_ERROR', 'Failed to fetch claims')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async fetchClaimById({ commit }, claimId) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.get(`/api/claims/${claimId}`)
        commit('SET_CURRENT_CLAIM', response.data)
      } catch (error) {
        console.error(`Error fetching claim ${claimId}:`, error)
        commit('SET_ERROR', 'Failed to fetch claim details')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async updateClaimStatus({ commit }, { claimId, status, reason }) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        await axios.post(`/api/claims/${claimId}/status`, {
          status,
          reason,
          changed_by: 'processor-ui'
        })
        
        commit('UPDATE_CLAIM_STATUS', { claimId, status })
      } catch (error) {
        console.error(`Error updating claim ${claimId} status:`, error)
        commit('SET_ERROR', 'Failed to update claim status')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async simulateProcess({ commit }, claimId) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.post(`/api/claims/${claimId}/simulate/process`)
        commit('UPDATE_CLAIM_STATUS', { 
          claimId, 
          status: response.data.claim_status 
        })
      } catch (error) {
        console.error(`Error simulating processing for claim ${claimId}:`, error)
        commit('SET_ERROR', 'Failed to simulate claim processing')
      } finally {
        commit('SET_LOADING', false)
      }
    },
    
    async simulateEmployerWait({ commit }, claimId) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)
      
      try {
        const response = await axios.post(`/api/claims/${claimId}/simulate/employer-wait`)
        commit('UPDATE_CLAIM_STATUS', { 
          claimId, 
          status: response.data.claim_status 
        })
      } catch (error) {
        console.error(`Error simulating employer wait for claim ${claimId}:`, error)
        commit('SET_ERROR', 'Failed to simulate employer wait')
      } finally {
        commit('SET_LOADING', false)
      }
    }
  }
})