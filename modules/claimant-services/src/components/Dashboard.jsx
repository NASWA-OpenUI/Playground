// Modules/claimant-services/src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getClaims } from '../services/api';

function Dashboard() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        // For demo purposes, we'll use hardcoded data initially
        // Later we'll connect to the API
        setClaims([
          {
            claimId: 'C123456',
            status: 'Processing',
            filingDate: '2025-05-10',
            benefitAmount: null
          }
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching claims:', error);
        setLoading(false);
      }
    };

    fetchClaims();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard">
      <h1>My Claims Dashboard</h1>
      {claims.length === 0 ? (
        <div className="no-claims">
          <p>You have no claims on file.</p>
          <Link to="/new-claim" className="btn btn-primary">File a New Claim</Link>
        </div>
      ) : (
        <div className="claims-list">
          <Link to="/new-claim" className="btn btn-primary">File a New Claim</Link>
          <table>
            <thead>
              <tr>
                <th>Claim ID</th>
                <th>Filing Date</th>
                <th>Status</th>
                <th>Benefit Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => (
                <tr key={claim.claimId}>
                  <td>{claim.claimId}</td>
                  <td>{new Date(claim.filingDate).toLocaleDateString()}</td>
                  <td>{claim.status}</td>
                  <td>{claim.benefitAmount ? `$${claim.benefitAmount.toFixed(2)}` : 'Pending'}</td>
                  <td>
                    <Link to={`/claim-status/${claim.claimId}`}>View Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
