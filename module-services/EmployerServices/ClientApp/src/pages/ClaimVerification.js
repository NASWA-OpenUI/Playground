import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { useNotification } from '../components/NotificationProvider';

const ClaimVerification = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    verifiedStartDate: '',
    verifiedEndDate: '',
    verifiedWages: '',
    separationConfirmed: false,
    verificationNotes: '',
    verifiedBy: ''
  });

  useEffect(() => {
    loadClaim();
  }, [claimId]);

  const loadClaim = async () => {
    try {
      const response = await api.getClaim(claimId);
      const claimData = response.data;
      setClaim(claimData);
      
      // Pre-populate form with claimed data
      setFormData({
        verifiedStartDate: claimData.claimedStartDate ? new Date(claimData.claimedStartDate).toISOString().split('T')[0] : '',
        verifiedEndDate: claimData.claimedEndDate ? new Date(claimData.claimedEndDate).toISOString().split('T')[0] : '',
        verifiedWages: claimData.claimedWages || '',
        separationConfirmed: false,
        verificationNotes: '',
        verifiedBy: ''
      });
    } catch (error) {
      console.error('Failed to load claim:', error);
      addNotification('Failed to load claim details', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.verifiedBy.trim()) {
      addNotification('Please enter your name in the "Verified By" field', 'error');
      return;
    }

    if (!formData.separationConfirmed) {
      addNotification('Please confirm the information is accurate before submitting', 'error');
      return;
    }

    setSubmitting(true);
    
    try {
      const submissionData = {
        ...formData,
        verifiedWages: parseFloat(formData.verifiedWages)
      };
      
      await api.submitVerification(claimId, submissionData);
      
      addNotification('Verification submitted successfully', 'success');
      navigate('/');
    } catch (error) {
      console.error('Failed to submit verification:', error);
      addNotification('Failed to submit verification. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return <LoadingSpinner message="Loading claim details..." />;
  }

  if (!claim) {
    return (
      <div className="container">
        <div className="form-container">
          <h2>Claim not found</h2>
          <p>The requested claim could not be found.</p>
          <button className="button primary" onClick={() => navigate('/')}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="verification-form">
      <div className="container">
        <div className="form-container">
          <div className="form-header">
            <h2>Employer Verification</h2>
            <p>Review and verify the employment information for Claim #{claimId}</p>
            <StatusBadge status={claim.status} />
          </div>

          {/* Claimant Information Display */}
          <div className="form-section">
            <h3>Claimant Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Claimant Name</label>
                <div className="readonly-field">{claim.claimantName}</div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <div className="readonly-field">{claim.claimantEmail}</div>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <div className="readonly-field">{claim.claimantPhone}</div>
              </div>
            </div>
          </div>

          {/* Claimed Employment Information */}
          <div className="form-section">
            <h3>Claimed Employment Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Employer Name</label>
                <div className="readonly-field">{claim.employerName}</div>
              </div>
              <div className="form-group">
                <label>Employer EIN</label>
                <div className="readonly-field">{claim.employerEin}</div>
              </div>
              <div className="form-group">
                <label>Claimed Start Date</label>
                <div className="readonly-field">
                  {new Date(claim.claimedStartDate).toLocaleDateString()}
                </div>
              </div>
              <div className="form-group">
                <label>Claimed End Date</label>
                <div className="readonly-field">
                  {new Date(claim.claimedEndDate).toLocaleDateString()}
                </div>
              </div>
              <div className="form-group">
                <label>Claimed Wages</label>
                <div className="readonly-field">${claim.claimedWages?.toLocaleString()}</div>
              </div>
              <div className="form-group">
                <label>Separation Reason</label>
                <div className="readonly-field">{claim.separationReason}</div>
              </div>
              {claim.separationDetails && (
                <div className="form-group full-width">
                  <label>Separation Details</label>
                  <div className="readonly-field">{claim.separationDetails}</div>
                </div>
              )}
            </div>
          </div>

          {/* Employer Verification Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Employer Verification</h3>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Please review the claimed information above and enter the correct employment details below.
              </p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="verifiedStartDate">Verified Start Date *</label>
                  <input
                    type="date"
                    id="verifiedStartDate"
                    name="verifiedStartDate"
                    value={formData.verifiedStartDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="verifiedEndDate">Verified End Date *</label>
                  <input
                    type="date"
                    id="verifiedEndDate"
                    name="verifiedEndDate"
                    value={formData.verifiedEndDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="verifiedWages">Verified Wages ($) *</label>
                  <input
                    type="number"
                    id="verifiedWages"
                    name="verifiedWages"
                    value={formData.verifiedWages}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="verifiedBy">Verified By *</label>
                  <input
                    type="text"
                    id="verifiedBy"
                    name="verifiedBy"
                    value={formData.verifiedBy}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="verificationNotes">Additional Notes (Optional)</label>
                  <textarea
                    id="verificationNotes"
                    name="verificationNotes"
                    value={formData.verificationNotes}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Any additional notes or discrepancies to report..."
                  />
                </div>
                <div className="form-group full-width">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      id="separationConfirmed"
                      name="separationConfirmed"
                      checked={formData.separationConfirmed}
                      onChange={handleInputChange}
                      required
                    />
                    <label htmlFor="separationConfirmed" style={{ margin: 0, fontWeight: 600 }}>
                      I confirm this information is accurate and complete *
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="verification-actions">
              <button
                type="button"
                className="button secondary"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={submitting || !formData.separationConfirmed}
              >
                {submitting ? 'Submitting...' : 'Submit Verification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClaimVerification;