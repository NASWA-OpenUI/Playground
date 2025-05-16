// claimant-services/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ClaimForm from './components/ClaimForm';
import ClaimStatus from './components/ClaimStatus';
import WeeklyCertification from './components/WeeklyCertification';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [userData, setUserData] = useState(null);
  
  // Simulate user authentication
  useEffect(() => {
    // In a real app, this would check for a valid session/token
    setUserData({
      name: 'John Doe',
      hasActiveClaim: false
    });
  }, []);
  
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <div className="header-content">
              <h1>UI Claimant Portal</h1>
              {userData && (
                <div className="user-info">
                  Welcome, {userData.name}
                </div>
              )}
            </div>
          </div>
        </header>
        
        <nav className="app-nav">
          <div className="container">
            <ul className="nav-links">
              <li>
                <Link to="/">Dashboard</Link>
              </li>
              <li>
                <Link to="/file-claim">File New Claim</Link>
              </li>
              <li>
                <Link to="/claim-status">Claim Status</Link>
              </li>
              <li>
                <Link to="/weekly-certification">Weekly Certification</Link>
              </li>
            </ul>
          </div>
        </nav>
        
        <main className="app-main">
          <div className="container">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/file-claim" element={<ClaimForm />} />
              <Route path="/claim-status" element={<ClaimStatus />} />
              <Route path="/weekly-certification" element={<WeeklyCertification />} />
            </Routes>
          </div>
        </main>
        
        <footer className="app-footer">
          <div className="container">
            <p>Department of Labor UI Modernization Project</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;