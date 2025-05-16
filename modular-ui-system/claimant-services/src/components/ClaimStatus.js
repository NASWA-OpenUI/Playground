// claimant-services/src/components/ClaimStatus.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getClaimStatus, getAllClaims } from '../services/claimService';
import './ClaimStatus.css';

const ClaimStatus = () => {
  const location = useLocation();
  const [claims, setClaims] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load claims on component mount
  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const claimsData = await getAllClaims();
        setClaims(claimsData);
        
        // If we have a claimId from navigation state, select it
        if (location.state?.claimId) {
          const claim = claimsData.find(c => c.claimId === location.state.claimId);
          if (claim) {
            setSelectedClaim(claim);
          }
        } else if (claimsData.length > 0) {
          // Otherwise select the most recent claim
          setSelectedClaim(claimsData[0]);
        }
      } catch (err) {
        console.error('Error fetching claims:', err);
        setError('Failed to load claims. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClaims();
  }, [location]);
  
  // Refresh selected claim status
  const refreshClaimStatus = async () => {
    if (!selectedClaim) return;
    
    try {
      const updatedStatus = await getClaimStatus(selectedClaim.claimId);
      
      setSelectedClaim(prev => ({
        ...prev,
        status: updatedStatus.status,
        weeklyBenefit: updatedStatus.weeklyBenefit,
        maxBenefit: updatedStatus.maxBenefit,
        lastUpdated: updatedStatus.lastUpdated
      }));
      
      // Also update in the claims list
      setClaims(prev => prev.map(claim => 
        claim.claimId === selectedClaim.claimId 
          ? { 
              ...claim, 
              status: updatedStatus.status,
              weeklyBenefit: updatedStatus.weeklyBenefit,
              maxBenefit: updatedStatus.maxBenefit,
              lastUpdated: updatedStatus.lastUpdated
            } 
          : claim
      ));
    } catch (err) {
      console.error('Error refreshing claim status:', err);
      setError('Failed to refresh claim status. Please try again later.');
    }
  };
  
  // Handle claim selection
  const handleClaimSelect = (claimId) => {
    const claim = claims.find(c => c.claimId === claimId);
    setSelectedClaim(claim);
  };
  
  if (loading) {
    return <div className="loading">Loading claim information...</div>;
  }
  
  if (error) {
    return <div className="error-message">{error}</div>;
  }
  
  if (claims.length === 0) {
    return (
      <div className="no-claims">
        <h2>No Claims Found</h2>
        <p>You don't have any unemployment insurance claims in our system.</p>
        <button className="primary-button" onClick={() => window.location.href = '/file-claim'}>
          File a New Claim
        </button>
      </div>
    );
  }
  
  // Get status class
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'processing':
        return 'status-processing';
      case 'pending':
        return 'status-pending';
      case 'denied':
        return 'status-denied';
      default:
        return '';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <div className="claim-status-container">
      <h2>Claim Status</h2>
      
      {location.state?.justSubmitted && (
        <div className="info-message">
          Your claim has been submitted and is being processed.
        </div>
      )}
      
      <div className="claim-selector">
        <label htmlFor="claimSelect">Select Claim:</label>
        <select 
          id="claimSelect" 
          value={selectedClaim?.claimId || ''}
          onChange={(e) => handleClaimSelect(e.target.value)}
        >
          {claims.map(claim => (
            <option key={claim.claimId} value={claim.claimId}>
              Claim {claim.claimId} - {new Date(claim.createdAt).toLocaleDateString()}
            </option>
          ))}
        </select>
        
        <button 
          className="refresh-button"
          onClick={refreshClaimStatus}
          aria-label="Refresh claim status"
        >
          ↻
        </button>
      </div>
      
      {selectedClaim && (
        <div className="claim-details">
          <div className="claim-header">
            <h3>Claim ID: {selectedClaim.claimId}</h3>
            <div className={`claim-status ${getStatusClass(selectedClaim.status)}`}>
              {selectedClaim.status}
            </div>
          </div>
          
          <div className="claim-info-grid">
            <div className="info-item">
              <div className="info-label">Filed Date</div>
              <div className="info-value">{formatDate(selectedClaim.createdAt)}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Last Updated</div>
              <div className="info-value">{formatDate(selectedClaim.updatedAt)}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Weekly Benefit Amount</div>
              <div className="info-value">
                {selectedClaim.weeklyBenefit 
                  ? `$${selectedClaim.weeklyBenefit.toFixed(2)}` 
                  : 'Pending'
                }
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Maximum Benefit Amount</div>
              <div className="info-value">
                {selectedClaim.maxBenefit 
                  ? `$${selectedClaim.maxBenefit.toFixed(2)}` 
                  : 'Pending'
                }
              </div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Employer</div>
              <div className="info-value">{selectedClaim.lastEmployer}</div>
            </div>
            
            <div className="info-item">
              <div className="info-label">Employment Dates</div>
              <div className="info-value">{selectedClaim.employmentDates}</div>
            </div>
          </div>
          
          <div className="claim-status-timeline">
            <h4>Claim Timeline</h4>
            <ul className="timeline">
              <li className="timeline-item complete">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h5>Claim Submitted</h5>
                  <p>{formatDate(selectedClaim.createdAt)}</p>
                </div>
              </li>
              
              <li className={`timeline-item ${selectedClaim.status !== 'Processing' ? 'complete' : 'current'}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h5>Initial Processing</h5>
                  <p>Claim information is being verified</p>
                </div>
              </li>
              
              <li className={`timeline-item ${selectedClaim.status === 'Approved' ? 'complete' : (selectedClaim.status === 'Processing' ? 'incomplete' : 'current')}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h5>Employer Verification</h5>
                  <p>Waiting for employer to confirm details</p>
                </div>
              </li>
              
              <li className={`timeline-item ${selectedClaim.status === 'Approved' ? 'complete' : 'incomplete'}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h5>Determination</h5>
                  <p>Final decision on your claim eligibility</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div className="claim-actions">
            <button 
              className="secondary-button"
              onClick={() => window.location.href = '/weekly-certification'}
              disabled={selectedClaim.status !== 'Approved'}
            >
              File Weekly Certification
            </button>
            
            <button className="secondary-button">
              View Payment History
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimStatus;