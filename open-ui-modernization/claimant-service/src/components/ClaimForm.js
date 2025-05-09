import React, { useState } from 'react';
import axios from 'axios';

function ClaimForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    ssn: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
    email: '',
    employerId: 'EMP001',
    lastWorkDate: '',
    reasonForSeparation: 'layoff',
    quarterlyWages: 12000
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Submit to claims processing service via Kong
      const response = await axios.post('http://localhost:8000/api/claims', formData);
      
      setSubmitResult({
        success: true,
        message: 'Your claim has been submitted successfully!',
        claimId: response.data.claimId,
        status: response.data.status
      });
      
      // Clear form after successful submission
      setFormData({
        firstName: '',
        lastName: '',
        ssn: '',
        dateOfBirth: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phoneNumber: '',
        email: '',
        employerId: 'EMP001',
        lastWorkDate: '',
        reasonForSeparation: 'layoff',
        quarterlyWages: 12000
      });
    } catch (error) {
      console.error('Error submitting claim:', error);
      setSubmitResult({
        success: false,
        message: 'There was an error submitting your claim. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div>
      <h2>File a New Unemployment Claim</h2>
      
      {submitResult && (
        <div className={`alert ${submitResult.success ? 'alert-success' : 'alert-error'}`}>
          <p>{submitResult.message}</p>
          {submitResult.success && (
            <p>Your claim ID is: <strong>{submitResult.claimId}</strong></p>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <h3>Personal Information</h3>
        
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
          <label htmlFor="ssn">Social Security Number</label>
          <input
            type="text"
            id="ssn"
            name="ssn"
            value={formData.ssn}
            onChange={handleChange}
            pattern="\d{3}-?\d{2}-?\d{4}"
            placeholder="123-45-6789"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="dateOfBirth">Date of Birth</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
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
          <label htmlFor="zipCode">Zip Code</label>
          <input
            type="text"
            id="zipCode"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            pattern="\d{5}(-\d{4})?"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number</label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <h3>Employment Information</h3>
        
        <div className="form-group">
          <label htmlFor="employerId">Last Employer</label>
          <select
            id="employerId"
            name="employerId"
            value={formData.employerId}
            onChange={handleChange}
            required
          >
            <option value="EMP001">Acme Industries</option>
            <option value="EMP002">TechCorp Inc</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="lastWorkDate">Last Day of Work</label>
          <input
            type="date"
            id="lastWorkDate"
            name="lastWorkDate"
            value={formData.lastWorkDate}
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
            <option value="layoff">Layoff</option>
            <option value="termination">Termination</option>
            <option value="quit">Voluntary Quit</option>
            <option value="reduction">Reduction in Hours</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="quarterlyWages">Average Quarterly Wages ($)</label>
          <input
            type="number"
            id="quarterlyWages"
            name="quarterlyWages"
            value={formData.quarterlyWages}
            onChange={handleChange}
            min="0"
            required
          />
        </div>
        
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Claim'}
        </button>
      </form>
    </div>
  );
}

export default ClaimForm;