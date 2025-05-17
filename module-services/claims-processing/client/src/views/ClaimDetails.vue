<template>
  <div class="claim-details">
    <div class="container">
      <div class="back-link">
        <router-link to="/queue">&larr; Back to Claims Queue</router-link>
      </div>
      
      <div v-if="loading" class="loading card">
        <p>Loading claim details...</p>
      </div>
      
      <div v-else-if="error" class="error card">
        <p>{{ error }}</p>
      </div>
      
      <div v-else-if="!claim" class="not-found card">
        <p>Claim not found.</p>
      </div>
      
      <template v-else>
        <div class="header card">
          <div class="claim-header">
            <div>
              <h1>Claim #{{ claim.claim_reference_id }}</h1>
              <p class="filing-date">Filed on {{ formatDate(claim.filing_date) }}</p>
            </div>
            <div class="status">
              <span :class="'status-badge ' + claim.claim_status">
                {{ formatStatus(claim.claim_status) }}
              </span>
            </div>
          </div>
          
          <div class="actions">
            <button 
              v-if="claim.claim_status === 'received'" 
              @click="processHandler(claim.claim_reference_id)"
              class="btn btn-warning"
            >
              Begin Processing
            </button>
            <button 
              v-if="claim.claim_status === 'processing'" 
              @click="employerWaitHandler(claim.claim_reference_id)"
              class="btn btn-success"
            >
              Request Employer Verification
            </button>
          </div>
        </div>
        
        <div class="content">
          <div class="left-column">
            <div class="card">
              <h2>Claimant Information</h2>
              <div class="info-item">
                <span class="label">Claimant ID:</span>
                <span class="value">{{ claim.claimant_id }}</span>
              </div>
              <div class="info-item">
                <span class="label">Separation Reason:</span>
                <span class="value">{{ claim.separation_reason }}</span>
              </div>
            </div>
            
            <div class="card">
              <h2>Employment History</h2>
              <div v-if="!claim.employment_records || claim.employment_records.length === 0" class="empty">
                <p>No employment records found.</p>
              </div>
              <div v-else class="employment-records">
                <div 
                  v-for="(record, index) in claim.employment_records" 
                  :key="index"
                  class="record"
                >
                  <h3>{{ record.employer_name }}</h3>
                  <div class="info-item">
                    <span class="label">Employer ID:</span>
                    <span class="value">{{ record.employer_id }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Position:</span>
                    <span class="value">{{ record.position_title }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Employment Period:</span>
                    <span class="value">{{ formatDate(record.start_date) }} to {{ formatDate(record.end_date) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Wages:</span>
                    <span class="value">{{ formatCurrency(record.wage_data) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="right-column">
            <div class="card">
              <h2>Status History</h2>
              <div v-if="!claim.status_history || claim.status_history.length === 0" class="empty">
                <p>No status history found.</p>
              </div>
              <div v-else class="status-history">
                <div 
                  v-for="(entry, index) in sortedStatusHistory" 
                  :key="index"
                  class="history-entry"
                >
                  <div class="status-info">
                    <span :class="'status-indicator ' + entry.status"></span>
                    <div>
                      <h4>{{ formatStatus(entry.status) }}</h4>
                      <p class="date">{{ formatDateTime(entry.change_date) }}</p>
                    </div>
                  </div>
                  <div class="reason" v-if="entry.change_reason">
                    <p>{{ entry.change_reason }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card">
              <h2>Update Status</h2>
              <div class="status-form">
                <div class="form-group">
                  <label for="status">Status:</label>
                  <select id="status" v-model="statusUpdate.status">
                    <option value="received">Received</option>
                    <option value="processing">Processing</option>
                    <option value="waiting_for_employer">Waiting for Employer</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="reason">Reason:</label>
                  <textarea 
                    id="reason" 
                    v-model="statusUpdate.reason" 
                    rows="3"
                    placeholder="Provide a reason for this status update"
                  ></textarea>
                </div>
                <button 
                  class="btn btn-success" 
                  @click="updateStatus"
                  :disabled="statusUpdate.status === claim.claim_status"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'ClaimDetails',
  data() {
    return {
      timer: null,
      statusUpdate: {
        status: '',
        reason: ''
      }
    }
  },
  computed: {
    ...mapGetters(['getCurrentClaim', 'isLoading', 'getError']),
    claim() {
      return this.getCurrentClaim
    },
    loading() {
      return this.isLoading
    },
    error() {
      return this.getError
    },
    sortedStatusHistory() {
      if (!this.claim.status_history) {
        return []
      }
      
      return [...this.claim.status_history].sort((a, b) => {
        return new Date(b.change_date) - new Date(a.change_date)
      })
    }
  },
  methods: {
    ...mapActions(['fetchClaimById', 'updateClaimStatus', 'simulateProcess', 'simulateEmployerWait']),
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString()
    },
    formatDateTime(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
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
    formatCurrency(amount) {
      if (!amount) return '$0.00'
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    },
    processHandler(claimId) {
      this.simulateProcess(claimId)
    },
    employerWaitHandler(claimId) {
      this.simulateEmployerWait(claimId)
    },
    updateStatus() {
      if (this.statusUpdate.status === this.claim.claim_status) {
        return
      }
      
      this.updateClaimStatus({
        claimId: this.claim.claim_reference_id,
        status: this.statusUpdate.status,
        reason: this.statusUpdate.reason
      })
      
      this.statusUpdate.reason = ''
    }
  },
  created() {
    this.fetchClaimById(this.$route.params.id)
    
    // Initialize status update
    if (this.claim) {
      this.statusUpdate.status = this.claim.claim_status
    }
    
    // Auto-refresh data every 30 seconds
    this.timer = setInterval(() => {
      this.fetchClaimById(this.$route.params.id)
    }, 30000)
  },
  watch: {
    claim(newClaim) {
      if (newClaim && !this.statusUpdate.status) {
        this.statusUpdate.status = newClaim.claim_status
      }
    }
  },
  beforeUnmount() {
    clearInterval(this.timer)
  }
}
</script>

<style scoped>
.back-link {
  margin-bottom: 1.5rem;
}

.back-link a {
  color: var(--primary-color);
  font-weight: 500;
}

.header {
  margin-bottom: 1.5rem;
}

.claim-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

h1 {
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.filing-date {
  color: #666;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
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

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.left-column,
.right-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

h2 {
  margin-bottom: 1rem;
  color: var(--primary-color);
  font-size: 1.25rem;
}

.info-item {
  margin-bottom: 0.75rem;
  display: flex;
}

.label {
  font-weight: 500;
  min-width: 150px;
}

.record {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.record:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.record h3 {
  margin-bottom: 0.75rem;
  color: var(--secondary-color);
}

.status-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-entry {
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.history-entry:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.status-info {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.status-indicator {
  display: block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 0.75rem;
  margin-top: 0.25rem;
}

.status-indicator.received {
  background-color: var(--primary-color);
}

.status-indicator.processing {
  background-color: var(--warning-color);
}

.status-indicator.waiting_for_employer {
  background-color: var(--accent-color);
}

.status-info h4 {
  margin: 0;
  margin-bottom: 0.25rem;
}

.date {
  font-size: 0.875rem;
  color: #666;
}

.status-form {
  margin-top: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.loading, 
.error, 
.not-found,
.empty {
  padding: 2rem;
  text-align: center;
}

.error {
  color: var(--accent-color);
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }
  
  .info-item {
    flex-direction: column;
  }
  
  .label {
    margin-bottom: 0.25rem;
  }
}
</style>