const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  // Using MongoDB ObjectId as claimId - will convert to string for GraphQL
  claimId: {
    type: String,
    unique: true,
    required: true
  },
  
  // User identification
  userId: {
    type: String,
    required: true
  },
  
  // Identity Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  ssn: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^\d{3}-\d{2}-\d{4}$/.test(v);
      },
      message: 'SSN must be in format XXX-XX-XXXX'
    }
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  phone: {
    type: String,
    required: true
  },
  
  // Address Information
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  
  // Employment Information
  employer: {
    name: { type: String, required: true },
    ein: { type: String, required: true }, // Employer Identification Number
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true }
    }
  },
  
  employmentDates: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  
  separationReason: {
    type: String,
    required: true,
    enum: ['laid_off', 'terminated', 'quit', 'contract_ended', 'other']
  },
  
  separationDetails: {
    type: String,
    maxlength: 500
  },
  
  // Wage Information
  wageData: {
    lastQuarterEarnings: { type: Number, required: true },
    annualEarnings: { type: Number, required: true }
  },
  
  // Claim Status (using camelCase as defined in architecture)
  status: {
    type: String,
    enum: ['submitted', 'processing', 'waitingForEmployer', 'approved', 'denied'],
    default: 'submitted'
  },
  
  // Benefit Information (populated later)
  weeklyBenefitAmount: {
    type: Number,
    default: null
  },
  
  maximumBenefitAmount: {
    type: Number,
    default: null
  },
  
  // System Information
  submissionTimestamp: {
    type: Date,
    default: Date.now
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    notes: String
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Pre-save middleware to update lastUpdated
ClaimSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  
  // Add to status history if status changed
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      notes: `Status changed to ${this.status}`
    });
  }
  
  next();
});

// Instance method to get status display name
ClaimSchema.methods.getStatusDisplayName = function() {
  const statusMap = {
    'submitted': 'Submitted',
    'processing': 'Processing',
    'waitingForEmployer': 'Waiting for Employer',
    'approved': 'Approved',
    'denied': 'Denied'
  };
  return statusMap[this.status] || this.status;
};

module.exports = mongoose.model('Claim', ClaimSchema);