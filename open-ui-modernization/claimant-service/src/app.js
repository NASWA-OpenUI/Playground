import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import ClaimForm from './components/ClaimForm';
import ClaimStatus from './components/ClaimStatus';
import WeeklyCertification from './components/WeeklyCertification';
import Home from './components/Home';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>State UI Benefits System</h1>
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/file-claim">File New Claim</Link></li>
            <li><Link to="/claim-status">Check Claim Status</Link></li>
            <li><Link to="/weekly-cert">Weekly Certification</Link></li>
          </ul>
        </nav>
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/file-claim" element={<ClaimForm />} />
          <Route path="/claim-status" element={<ClaimStatus />} />
          <Route path="/weekly-cert" element={<WeeklyCertification />} />
        </Routes>
      </main>
      
      <footer>
        <p>Unemployment Insurance Modernization Demo - NASWA</p>
      </footer>
    </div>
  );
}

export default App;