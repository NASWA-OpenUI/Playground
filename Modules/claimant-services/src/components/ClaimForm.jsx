// Modules/claimant-services/src/components/ClaimForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitClaim } from '../services/api';

function ClaimForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    ssn: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    employerName: '',
    employerId: 'EMP12345', // For demo purposes
    startDate: '',
    endDate: '',
    reasonForSeparation: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Format the data according to our contract
      const claimData = {
        claimantId: 'CLMT' + Math.floor(Math.random() * 10000), // For demo
        firstName: formData.firstName,
        lastName: formData.lastName,
        ssn: formData.ssn,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode
        },
        contactInfo: {
          email: formData.email,
          phone: formData.phone
        },
        employmentHistory: [
          {
            employerId: formData.employerId,
            employerName: formData.employerName,
            startDate: formData.startDate,
            endDate: formData.endDate,
            reasonForSeparation: formData.reasonForSeparation
          }
        ],
        filingDate: new Date().toISOString()
      };
      
      // For now, just log the data and mock a response
      console.log('Submitting claim:', claimData);
      
      // Mock API response
      const response = { 
        claimId: 'C' + Math.floor(Math.random() * 100000),
        status: 'Submitted'
      };
      
      // Navigate to the status page with the new claim ID
      navigate(`/claim-status/${response.claimId}`);
    } catch (error) {
      console.error('Error submitting claim:', error);
      setError('Failed to submit claim. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="claim-form">
      <h1>File a New Unemployment Claim</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <h2>Personal Information</h2>
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input 
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input 
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="ssn">SSN (last 4 digits only for demo)</label>
          <input 
            type="text"
            id="ssn"
            name="ssn"
            value={formData.ssn}
            onChange={handleChange}
            maxLength="4"
            required
          />
        </div>

        <h2>Contact Information</h2>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input 
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Phone</label>
          <input 
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <h2>Address</h2>
        <div className="form-group">
          <label htmlFor="street">Street</label>
          <input 
            type="text"
            id="street"
            name="street"
            value={formData.street}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="city">City</label>
          <input 
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="state">State</label>
          <input 
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="zipCode">ZIP Code</label>
          <input 
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            required
          />
        </div>

        <h2>Most Recent Employment</h2>
        <div className="form-group">
          <label htmlFor="employerName">Employer Name</label>
          <input 
            type="text"
            id="employerName"
            name="employerName"
            value={formData.employerName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="startDate">Start Date</label>
          <input 
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input 
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="reasonForSeparation">Reason for Separation</label>
          <select
            id="reasonForSeparation"
            name="reasonForSeparation"
            value={formData.reasonForSeparation}
            onChange={handleChange}
            required
          >
            <option value="">Select a reason</option>
            <option value="Layoff">Layoff</option>
            <option value="Termination">Termination</option>
            <option value="Quit">Quit</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Claim'}
        </button>
      </form>
    </div>
  );
}

export default ClaimForm;
