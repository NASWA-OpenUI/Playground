// Modules/claimant-services/src/components/ClaimStatus.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getClaimStatus } from '../services/api';

function ClaimStatus() {
  const { claimId } = useParams();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClaimStatus = async () => {
      try {
        // For demo purposes, we'll use hardcoded data initially
        // Later we'll connect to the API
        setClaim({
          claimId: claimId,
          status: 'Processing',
          statusDate: new Date().toISOString(),
          messages: ['Your claim has been submitted and is being processed.']
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching claim status:', error);
        setError('Failed to fetch claim status. Please try again later.');
        setLoading(false);
      }
    };

    fetchClaimStatus();
    
    // Setup polling for status updates (in real app)
    const intervalId = setInterval(fetchClaimStatus, 10000);
    
    return () => clearInterval(intervalId);
  }, [claimId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="claim-status">
      <h1>Claim Status</h1>
      <div className="status-card">
        <h2>Claim #{claim.claimId}</h2>
        <div className="status-info">
          <div className="status-label">Status:</div>
          <div className={`status-value status-${claim.status.toLowerCase().replace(' ', '-')}`}>
            {claim.status}
          </div>
        </div>
        <div className="status-date">
          <div className="status-label">Last Updated:</div>
          <div className="status-value">
            {new Date(claim.statusDate).toLocaleString()}
          </div>
        </div>
        
        {claim.benefitAmount && (
          <div className="benefit-amount">
            <div className="status-label">Weekly Benefit Amount:</div>
            <div className="status-value">${claim.benefitAmount.toFixed(2)}</div>
          </div>
        )}
        
        {claim.messages && claim.messages.length > 0 && (
          <div className="status-messages">
            <h3>Messages:</h3>
            <ul>
              {claim.messages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClaimStatus;
