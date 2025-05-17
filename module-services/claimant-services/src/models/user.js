/**
 * User model for MongoDB
 */

const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zip: {
    type: String,
    required: true
  }
});

const ContactInfoSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: AddressSchema,
    required: true
  }
});

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    required: true
  },
  ssn: {
    type: String,
    required: true,
    unique: true,
    match: [/^\d{3}-\d{2}-\d{4}$/, 'Please provide a valid SSN']
  },
  contactInfo: {
    type: ContactInfoSchema,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);