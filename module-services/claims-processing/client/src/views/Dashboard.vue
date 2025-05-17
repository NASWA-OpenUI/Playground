<template>
  <div class="dashboard">
    <div class="container">
      <h1>Claims Processing Dashboard</h1>
      
      <div class="stats-cards">
        <div class="stat-card">
          <h2>{{ getStatusCount('received') }}</h2>
          <p>New Claims</p>
        </div>
        <div class="stat-card">
          <h2>{{ getStatusCount('processing') }}</h2>
          <p>In Process</p>
        </div>
        <div class="stat-card">
          <h2>{{ getStatusCount('waiting_for_employer') }}</h2>
          <p>Waiting for Employer</p>
        </div>
      </div>
      
      <div class="card">
        <h2>Recent Claims</h2>
        <div v-if="loading" class="loading">
          <p>Loading claims...</p>
        </div>
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
        </div>
        <div v-else-if="claims.length === 0" class="empty">
          <p>No claims available.</p>
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
            <tr v-for="claim in recentClaims" :key="claim.claim_reference_id">
              <td>{{ claim.claim_reference_id }}</td>
              <td>{{ claim.claimant_id }}</td>
              <td>{{ formatDate(claim.filing_date) }}</td>
              <td>
                <span :class="'status-badge ' + claim.claim_status">
                  {{ formatStatus(claim.claim_status) }}
                </span>
              </td>
              <td>
                <router-link :to="'/claim/' + claim.claim_reference_id" class="btn">
                  View Details
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="view-all">
          <router-link to="/queue" class="btn">View All Claims</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'Dashboard',
  data() {
    return {
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
    recentClaims() {
      return this.claims.slice(0, 5)
    }
  },
  methods: {
    ...mapActions(['fetchClaims']),
    getStatusCount(status) {
      return this.claims.filter(claim => claim.claim_status === status).length
    },
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  text-align: center;
}

.stat-card h2 {
  font-size: 2.5rem;
  color: var(--secondary-color);
  margin-bottom: 0.5rem;
}

.stat-card p {
  color: var(--text-color);
  font-weight: 500;
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

.loading, 
.error, 
.empty {
  padding: 2rem;
  text-align: center;
}

.error {
  color: var(--accent-color);
}

.view-all {
  margin-top: 1.5rem;
  text-align: center;
}
</style>