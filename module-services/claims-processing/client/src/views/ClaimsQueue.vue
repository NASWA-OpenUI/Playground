<template>
  <div class="claims-queue">
    <div class="container">
      <h1>Claims Queue</h1>
      
      <div class="filters card">
        <div class="filter-group">
          <label for="status-filter">Status:</label>
          <select id="status-filter" v-model="statusFilter">
            <option value="">All</option>
            <option value="received">Received</option>
            <option value="processing">Processing</option>
            <option value="waiting_for_employer">Waiting for Employer</option>
          </select>
        </div>
        
        <button class="btn" @click="fetchClaims">Apply Filters</button>
      </div>
      
      <div class="card">
        <div v-if="loading" class="loading">
          <p>Loading claims...</p>
        </div>
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
        </div>
        <div v-else-if="filteredClaims.length === 0" class="empty">
          <p>No claims match the current filters.</p>
        </div>
        <table v-else class="claims-table">
          <thead>
            <tr>
              <th>Claim ID</th>
              <th>Claimant</th>
              <th>Filing Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="claim in filteredClaims" :key="claim.claim_reference_id">
              <td>{{ claim.claim_reference_id }}</td>
              <td>{{ claim.claimant_id }}</td>
              <td>{{ formatDate(claim.filing_date) }}</td>
              <td>
                <span :class="'status-badge ' + claim.claim_status">
                  {{ formatStatus(claim.claim_status) }}
                </span>
              </td>
              <td class="actions">
                <router-link :to="'/claim/' + claim.claim_reference_id" class="btn">
                  View
                </router-link>
                <button 
                  v-if="claim.claim_status === 'received'" 
                  @click="processHandler(claim.claim_reference_id)"
                  class="btn btn-warning"
                >
                  Process
                </button>
                <button 
                  v-if="claim.claim_status === 'processing'" 
                  @click="employerWaitHandler(claim.claim_reference_id)"
                  class="btn btn-success"
                >
                  Request Employer Info
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'ClaimsQueue',
  data() {
    return {
      statusFilter: '',
      timer: null
    }
  },
  computed: {
    ...mapGetters(['getClaims', 'isLoading', 'getError']),
    claims() {
      return this.getClaims
    },
    loading() {
      return this.isLoading
    },
    error() {
      return this.getError
    },
    filteredClaims() {
      if (!this.statusFilter) {
        return this.claims
      }
      
      return this.claims.filter(claim => claim.claim_status === this.statusFilter)
    }
  },
  methods: {
    ...mapActions(['fetchClaims', 'simulateProcess', 'simulateEmployerWait']),
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString()
    },
    formatStatus(status) {
      switch (status) {
        case 'received':
          return 'Received'
        case 'processing':
          return 'Processing'
        case 'waiting_for_employer':
          return 'Waiting for Employer'
        default:
          return status.charAt(0).toUpperCase() + status.slice(1)
      }
    },
    processHandler(claimId) {
      this.simulateProcess(claimId)
    },
    employerWaitHandler(claimId) {
      this.simulateEmployerWait(claimId)
    }
  },
  created() {
    this.fetchClaims()
    
    // Auto-refresh data every 30 seconds
    this.timer = setInterval(() => {
      this.fetchClaims()
    }, 30000)
  },
  beforeUnmount() {
    clearInterval(this.timer)
  }
}
</script>

<style scoped>
h1 {
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

.filters {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
}

.filter-group {
  margin-right: 1.5rem;
  display: flex;
  align-items: center;
}

.filter-group label {
  margin-right: 0.5rem;
  font-weight: 500;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.claims-table {
  width: 100%;
  border-collapse: collapse;
}

.claims-table th, 
.claims-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.claims-table th {
  background-color: var(--light-color);
  font-weight: 500;
  color: var(--primary-color);
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.received {
  background-color: var(--light-color);
  color: var(--primary-color);
}

.status-badge.processing {
  background-color: var(--warning-color);
  color: white;
}

.status-badge.waiting_for_employer {
  background-color: var(--accent-color);
  color: white;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.loading, 
.error, 
.empty {
  padding: 2rem;
  text-align: center;
}

.error {
  color: var(--accent-color);
}
</style>