import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import signalRService from '../services/signalr';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../components/NotificationProvider';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const loadDashboardData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      const response = await api.getDashboardData();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Start SignalR connection
    signalRService.start();

    // Listen for real-time updates
    const handleClaimVerified = (claimId) => {
      addNotification(`Claim ${claimId} has been verified successfully`, 'success');
      loadDashboardData(true);
    };

    const handleClaimStatusChanged = (data) => {
      if (data.newStatus === 'AWAITING_EMPLOYER') {
        addNotification(`New claim ${data.claimId} requires employer verification`, 'warning');
        loadDashboardData(true);
      }
    };

    signalRService.on('claimVerified', handleClaimVerified);
    signalRService.on('claimStatusChanged', handleClaimStatusChanged);

    return () => {
      signalRService.off('claimVerified', handleClaimVerified);
      signalRService.off('claimStatusChanged', handleClaimStatusChanged);
    };
  }, [addNotification]);

  const handleClaimClick = (claimId) => {
    navigate(`/claims/${claimId}`);
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="container">
          <h1>Employer Verification Dashboard</h1>
          <p>Review and verify unemployment insurance claims requiring employer confirmation</p>
        </div>
      </div>

      <div className="container">
        {/* Dashboard Stats */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Pending Claims</h3>
            <div className="stat-number">{dashboardData?.pendingClaimsCount || 0}</div>
            <div className="stat-label">Awaiting Review</div>
          </div>
          <div className="stat-card">
            <h3>Total Verifications</h3>
            <div className="stat-number">{dashboardData?.totalVerifications || 0}</div>
            <div className="stat-label">All Time</div>
          </div>
          <div className="stat-card">
            <h3>Today's Verifications</h3>
            <div className="stat-number">{dashboardData?.todayVerifications || 0}</div>
            <div className="stat-label">Completed Today</div>
          </div>
        </div>

        {/* Claims Queue */}
        <div className="claims-queue">
          <div className="queue-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2>Claims Requiring Verification</h2>
                <p>Click on a claim to begin the verification process</p>
              </div>
              <button 
                className="button secondary" 
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="claims-list">
            {dashboardData?.pendingClaims?.length > 0 ? (
              dashboardData.pendingClaims.map((claim) => (
                <div
                  key={claim.claimReferenceId}
                  className="claim-item"
                  onClick={() => handleClaimClick(claim.claimReferenceId)}
                >
                  <div className="claim-header">
                    <div className="claim-id">Claim #{claim.claimReferenceId}</div>
                    <StatusBadge status={claim.status} />
                  </div>
                  <div className="claim-info">
                    <div><strong>Claimant:</strong> {claim.claimantName}</div>
                    <div><strong>Employer:</strong> {claim.employerName}</div>
                    <div><strong>Employment Period:</strong> {new Date(claim.claimedStartDate).toLocaleDateString()} - {new Date(claim.claimedEndDate).toLocaleDateString()}</div>
                    <div><strong>Claimed Wages:</strong> ${claim.claimedWages?.toLocaleString()}</div>
                    <div><strong>Separation Reason:</strong> {claim.separationReason}</div>
                    <div><strong>Submitted:</strong> {new Date(claim.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <h3>No claims awaiting verification</h3>
                <p>All claims have been processed. New claims will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;