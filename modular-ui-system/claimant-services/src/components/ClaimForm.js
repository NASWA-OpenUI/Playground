// claimant-services/src/components/ClaimForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitClaim } from '../services/claimService';
import './ClaimForm.css';

const ClaimForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    claimantName: '',
    ssn: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    lastEmployer: '',
    employerAddress: '',
    employmentStartDate: '',
    employmentEndDate: '',
    weeklyWage: '',
    reasonForSeparation: 'laid-off',
    hasWorkedOutsideState: false
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    // Required fields
    const requiredFields = [
      'claimantName', 'ssn', 'dateOfBirth', 'email', 'phone', 
      'address', 'city', 'state', 'zipCode', 'lastEmployer',
      'employmentStartDate', 'employmentEndDate', 'weeklyWage'
    ];
    
    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        errors[field] = 'This field is required';
      }
    });
    
    // SSN format (simple validation)
    if (formData.ssn && !formData.ssn.match(/^\d{3}-\d{2}-\d{4}$/)) {
      errors.ssn = 'Please enter a valid SSN (XXX-XX-XXXX)';
    }
    
    // Email format
    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Weekly wage must be a number
    if (formData.weeklyWage && isNaN(parseFloat(formData.weeklyWage))) {
      errors.weeklyWage = 'Please enter a valid dollar amount';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Format data for API
      const apiData = {
        ...formData,
        weeklyWage: parseFloat(formData.weeklyWage),
        employmentDates: `${formData.employmentStartDate} - ${formData.employmentEndDate}`
      };
      
      // Submit claim to API
      const result = await submitClaim(apiData);
      
      setSubmitSuccess(true);
      
      // Redirect to claim status page after a delay
      setTimeout(() => {
        navigate('/claim-status', { 
          state: { 
            claimId: result.claim.claimId,
            justSubmitted: true 
          } 
        });
      }, 3000);
    } catch (error) {
      console.error('Error submitting claim:', error);
      setSubmitError(error.message || 'An error occurred while submitting your claim. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (submitSuccess) {
    return (
      <div className="claim-form-success">
        <h2>Claim Submitted Successfully!</h2>
        <p>Your claim has been received and is being processed.</p>
        <p>You will be redirected to the claim status page shortly...</p>
      </div>
    );
  }
  
  return (
    <div className="claim-form-container">
      <h2>File a New Unemployment Insurance Claim</h2>
      
      {submitError && (
        <div className="error-message">
          {submitError}
        </div>
      )}
      
      <form className="claim-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-group">
            <label htmlFor="claimantName">Full Name</label>
            <input
              type="text"
              id="claimantName"
              name="claimantName"
              value={formData.claimantName}
              onChange={handleChange}
            />
            {formErrors.claimantName && <div className="field-error">{formErrors.claimantName}</div>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ssn">Social Security Number</label>
              <input
                type="text"
                id="ssn"
                name="ssn"
                placeholder="XXX-XX-XXXX"
                value={formData.ssn}
                onChange={handleChange}
              />
              {formErrors.ssn && <div className="field-error">{formErrors.ssn}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              {formErrors.dateOfBirth && <div className="field-error">{formErrors.dateOfBirth}</div>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
              {formErrors.email && <div className="field-error">{formErrors.email}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
              {formErrors.phone && <div className="field-error">{formErrors.phone}</div>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Street Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
            {formErrors.address && <div className="field-error">{formErrors.address}</div>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              {formErrors.city && <div className="field-error">{formErrors.city}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="state">State</label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
              >
                <option value="">Select State</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                {/* Add all states here */}
                <option value="WY">Wyoming</option>
              </select>
              {formErrors.state && <div className="field-error">{formErrors.state}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="zipCode">Zip Code</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
              />
              {formErrors.zipCode && <div className="field-error">{formErrors.zipCode}</div>}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Employment Information</h3>
          
          <div className="form-group">
            <label htmlFor="lastEmployer">Last Employer</label>
            <input
              type="text"
              id="lastEmployer"
              name="lastEmployer"
              value={formData.lastEmployer}
              onChange={handleChange}
            />
            {formErrors.lastEmployer && <div className="field-error">{formErrors.lastEmployer}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="employerAddress">Employer Address</label>
            <input
              type="text"
              id="employerAddress"
              name="employerAddress"
              value={formData.employerAddress}
              onChange={handleChange}
            />
            {formErrors.employerAddress && <div className="field-error">{formErrors.employerAddress}</div>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employmentStartDate">Start Date</label>
              <input
                type="date"
                id="employmentStartDate"
                name="employmentStartDate"
                value={formData.employmentStartDate}
                onChange={handleChange}
              />
              {formErrors.employmentStartDate && <div className="field-error">{formErrors.employmentStartDate}</div>}
            </div>
            
            <div className="form-group">
              <label htmlFor="employmentEndDate">End Date</label>
              <input
                type="date"
                id="employmentEndDate"
                name="employmentEndDate"
                value={formData.employmentEndDate}
                onChange={handleChange}
              />
              {formErrors.employmentEndDate && <div className="field-error">{formErrors.employmentEndDate}</div>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="weeklyWage">Weekly Wage ($)</label>
            <input
              type="text"
              id="weeklyWage"
              name="weeklyWage"
              value={formData.weeklyWage}
              onChange={handleChange}
            />
            {formErrors.weeklyWage && <div className="field-error">{formErrors.weeklyWage}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="reasonForSeparation">Reason for Separation</label>
            <select
              id="reasonForSeparation"
              name="reasonForSeparation"
              value={formData.reasonForSeparation}
              onChange={handleChange}
            >
              <option value="laid-off">Laid Off</option>
              <option value="fired">Fired</option>
              <option value="quit">Quit</option>
              <option value="still-employed">Still Employed (Reduced Hours)</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="hasWorkedOutsideState"
              name="hasWorkedOutsideState"
              checked={formData.hasWorkedOutsideState}
              onChange={handleChange}
            />
            <label htmlFor="hasWorkedOutsideState">
              I have worked outside this state in the last 18 months
            </label>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Certification</h3>
          <p className="certification-text">
            I certify that the information I have provided is correct to the best of my knowledge. 
            I understand that providing false information may result in penalties and/or prosecution.
          </p>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="certify"
              name="certify"
              required
            />
            <label htmlFor="certify">
              I agree with the above statement
            </label>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="primary-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClaimForm;