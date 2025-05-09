import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-page">
      <h2>Welcome to the State Unemployment Insurance System</h2>
      <p>
        This system allows you to file for unemployment benefits, check the status of your claim,
        and complete weekly certifications to receive your benefits.
      </p>
      
      <div className="action-cards">
        <div className="card">
          <h3>File a New Claim</h3>
          <p>
            If you've recently become unemployed or had your hours reduced,
            you may be eligible for unemployment insurance benefits.
          </p>
          <Link to="/file-claim">
            <button>File a Claim</button>
          </Link>
        </div>
        
        <div className="card">
          <h3>Check Claim Status</h3>
          <p>
            Already filed a claim? Check the status of your unemployment
            insurance claim and view your benefit details.
          </p>
          <Link to="/claim-status">
            <button>View Status</button>
          </Link>
        </div>
        
        <div className="card">
          <h3>Weekly Certification</h3>
          <p>
            You must certify weekly to receive your benefits. Confirm that you're
            still unemployed and report any earnings or job offers.
          </p>
          <Link to="/weekly-cert">
            <button>Certify for Benefits</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;