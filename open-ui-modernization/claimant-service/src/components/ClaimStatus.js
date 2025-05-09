import React, { useState } from 'react';
import axios from 'axios';

function ClaimStatus() {
  const [claimId, setClaimId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [claimData, setClaimData] = useState(null);
  
  const handleChange = (e) => {
    setClaimId(e.target.value);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Get claim status from claims processing via Kong
      const response = await axios.get(`http://localhost:8000/api/claims/${claimId}`);
      
      setClaimData(response.data.claim);
      
      // If monetary determination is complete, get benefit details
      if (response.data.claim.status === 'MONETARY_DETERMINATION_COMPLETE') {
        try {
          const benefitResponse = await axios.get(
            `http://localhost:8000/api/benefits/calculations/${claimId}`
          );
          
          setClaimData(prevData => ({
            ...prevData,
            benefitDetails: benefitResponse.data.calculation
          }));
        } catch (benefitError) {
          console.error('Error fetching benefit details:', benefitError);
        }
      }
    } catch (error) {
      console.error('Error fetching claim status:', error);
      setError('Claim not found or error retrieving claim information.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to format claim status for display
  const formatStatus = (status) => {
    switch (status) {
      case 'PENDING_EMPLOYER_VERIFICATION':
        return 'Pending Employer Verification';
      case 'DENIED_BY_EMPLOYER':
        return 'Denied by Employer';
      case 'PENDING_BENEFIT_CALCULATION':
        return 'Pending Benefit Calculation';
      case 'MONETARY_DETERMINATION_COMPLETE':
        return 'Monetary Determination Complete';
      default:
        return status;
    }
  };
  
  return (
    <div>
      <h2>Check Claim Status</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="claimId">Claim ID</label>
          <input
            type="text"
            id="claimId"
            value={claimId}
            onChange={handleChange}
            required
            placeholder="Enter your claim ID"
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Check Status'}
        </button>
      </form>
      
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}
      
      {claimData && (
        <div className="claim-details">
          <h3>Claim Information</h3>
          
          <div className="info-card">
            <p><strong>Claim ID:</strong> {claimData.id}</p>
            <p><strong>Status:</strong> {formatStatus(claimData.status)}</p>
            <p><strong>Filed Date:</strong> {new Date(claimData.createdAt).toLocaleDateString()}</p>
            
            {claimData.employerVerified !== undefined && (
              <p>
                <strong>Employer Verification:</strong> 
                {claimData.employerVerified ? 'Verified' : 'Denied'}
                {claimData.employerVerificationReason && 
                  ` - Reason: ${claimData.employerVerificationReason}`}
              </p>
            )}
            
            {claimData.weeklyBenefit && (
              <div className="benefit-info">
                <h4>Benefit Details</h4>
                <p><strong>Weekly Benefit Amount:</strong> ${claimData.weeklyBenefit.toFixed(2)}</p>
                <p><strong>Maximum Benefit Amount:</strong> ${claimData.maxTotalBenefit.toFixed(2)}</p>
              </div>
            )}
            
            {claimData.benefitDetails && (
              <div className="benefit-info">
                <h4>Benefit Calculation</h4>
                <p><strong>Quarterly Wages:</strong> ${claimData.benefitDetails.quarterlyWages.toFixed(2)}</p>
                <p><strong>Benefit Rate:</strong> {(claimData.benefitDetails.benefitRate * 100).toFixed(2)}%</p>
                <p><strong>Weekly Benefit:</strong> ${claimData.benefitDetails.weeklyBenefit.toFixed(2)}</p>
                <p><strong>Maximum Total Benefit:</strong> ${claimData.benefitDetails.maxTotalBenefit.toFixed(2)}</p>
              </div>
            )}
          </div>
          
          <div className="status-timeline">
            <h4>Claim Progress</h4>
            <ul className="timeline">
              <li className={`step ${claimData.createdAt ? 'completed' : ''}`}>
                <span className="step-title">Claim Filed</span>
                <span className="step-date">
                  {claimData.createdAt ? new Date(claimData.createdAt).toLocaleDateString() : 'Pending'}
                </span>
              </li>
              <li className={`step ${claimData.employerVerified !== undefined ? 'completed' : ''}`}>
                <span className="step-title">Employer Verification</span>
                <span className="step-date">
                  {claimData.employerVerified !== undefined ? 
                    (claimData.employerVerified ? 'Verified' : 'Denied') : 'Pending'}
                </span>
              </li>
              <li className={`step ${claimData.status === 'MONETARY_DETERMINATION_COMPLETE' ? 'completed' : ''}`}>
                <span className="step-title">Monetary Determination</span>
                <span className="step-date">
                  {claimData.status === 'MONETARY_DETERMINATION_COMPLETE' ? 'Complete' : 'Pending'}
                </span>
              </li>
              <li className="step">
                <span className="step-title">Weekly Certification</span>
                <span className="step-date">Not Started</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClaimStatus;