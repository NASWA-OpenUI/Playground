/**
 * Claim model for MongoDB
 */

const mongoose = require('mongoose');

const EmploymentRecordSchema = new mongoose.Schema({
  employerId: {
    type: String,
    required: true
  },
  employerName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  wages: {
    type: Number,
    required: true
  },
  position: {
    type: String,
    required: true
  }
});

const ClaimSchema = new mongoose.Schema({
  claimId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  employmentHistory: {
    type: [EmploymentRecordSchema],
    required: true,
    validate: [arrayMinLength, 'Employment history must have at least one record']
  },
  separationReason: {
    type: String,
    required: true,
    enum: ['Layoff', 'Termination', 'Resignation', 'Other']
  },
  status: {
    type: String,
    required: true,
    enum: ['Submitted', 'InProcess', 'WaitingEmployerInfo', 'Approved', 'Denied'],
    default: 'Submitted'
  },
  submissionDate: {
    type: Date,
    default: Date.now
  }
});

// Validator for array min length
function arrayMinLength(val) {
  return val.length > 0;
}

module.exports = mongoose.model('Claim', ClaimSchema);