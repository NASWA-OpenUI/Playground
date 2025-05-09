import React, { useState } from 'react';

function WeeklyCertification() {
  const [formData, setFormData] = useState({
    claimId: '',
    weekEnding: '',
    workedDuringWeek: 'no',
    earnings: 0,
    ableToWork: 'yes',
    availableForWork: 'yes',
    lookingForWork: 'yes',
    refusedWork: 'no',
    refusalReason: ''
  });
  
  const [submitted, setSubmitted] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'number' ? Number(value) : value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would submit to an API
    setSubmitted(true);
  };
  
  return (
    <div>
      <h2>Weekly Certification</h2>
      
      {submitted ? (
        <div className="alert alert-success">
          <h3>Weekly Certification Submitted</h3>
          <p>Your weekly certification has been successfully submitted for the week ending {formData.weekEnding}.</p>
          <p>Your payment is being processed. Please allow 2-3 business days for your benefit payment.</p>
          <button onClick={() => setSubmitted(false)}>Submit Another Certification</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="claimId">Claim ID</label>
            <input 
              type="text" 
              id="claimId" 
              name="claimId" 
              value={formData.claimId}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="weekEnding">Week Ending Date (Sunday)</label>
            <input 
              type="date" 
              id="weekEnding" 
              name="weekEnding" 
              value={formData.weekEnding}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Did you work during this week?</label>
            <div className="radio-group">
              <label>
                <input 
                  type="radio"
                  name="workedDuringWeek"
                  value="yes"
                  checked={formData.workedDuringWeek === 'yes'}
                  onChange={handleChange}
                /> Yes
              </label>
              <label>
                <input 
                  type="radio"
                  name="workedDuringWeek"
                  value="no"
                  checked={formData.workedDuringWeek === 'no'}
                  onChange={handleChange}
                /> No
              </label>
            </div>
          </div>
          
          {formData.workedDuringWeek === 'yes' && (
            <div className="form-group">
              <label htmlFor="earnings">Earnings before deductions ($)</label>
              <input 
                type="number" 
                id="earnings" 
                name="earnings" 
                value={formData.earnings}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Were you physically able to work each day?</label>
            <div className="radio-group">
              <label>
                <input 
                  type="radio"
                  name="ableToWork"
                  value="yes"
                  checked={formData.ableToWork === 'yes'}
                  onChange={handleChange}
                /> Yes
              </label>
              <label>
                <input 
                  type="radio"
                  name="ableToWork"
                  value="no"
                  checked={formData.ableToWork === 'no'}
                  onChange={handleChange}
                /> No
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label>Were you available for work each day?</label>
            <div className="radio-group">
              <label>
                <input 
                  type="radio"
                  name="availableForWork"
                  value="yes"
                  checked={formData.availableForWork === 'yes'}
                  onChange={handleChange}
                /> Yes
              </label>
              <label>
                <input 
                  type="radio"
                  name="availableForWork"
                  value="no"
                  checked={formData.availableForWork === 'no'}
                  onChange={handleChange}
                /> No
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label>Did you look for work this week?</label>
            <div className="radio-group">
              <label>
                <input 
                  type="radio"
                  name="lookingForWork"
                  value="yes"
                  checked={formData.lookingForWork === 'yes'}
                  onChange={handleChange}
                /> Yes
              </label>
              <label>
                <input 
                  type="radio"
                  name="lookingForWork"
                  value="no"
                  checked={formData.lookingForWork === 'no'}
                  onChange={handleChange}
                /> No
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label>Did you refuse any offer of work this week?</label>
            <div className="radio-group">
              <label>
                <input 
                  type="radio"
                  name="refusedWork"
                  value="yes"
                  checked={formData.refusedWork === 'yes'}
                  onChange={handleChange}
                /> Yes
              </label>
              <label>
                <input 
                  type="radio"
                  name="refusedWork"
                  value="no"
                  checked={formData.refusedWork === 'no'}
                  onChange={handleChange}
                /> No
              </label>
            </div>
          </div>
          
          {formData.refusedWork === 'yes' && (
            <div className="form-group">
              <label htmlFor="refusalReason">Please explain why you refused work:</label>
              <textarea
                id="refusalReason"
                name="refusalReason"
                value={formData.refusalReason}
                onChange={handleChange}
                required
                rows="3"
              ></textarea>
            </div>
          )}
          
          <div className="certification">
            <p>
              I certify that the information I have provided is true and correct to the best of my knowledge.
              I understand that providing false information may result in penalties and/or prosecution.
            </p>
            <label>
              <input type="checkbox" required /> I agree
            </label>
          </div>
          
          <button type="submit">Submit Weekly Certification</button>
        </form>
      )}
    </div>
  );
}

export default WeeklyCertification;