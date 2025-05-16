// Modules/claimant-services/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ClaimForm from './components/ClaimForm';
import ClaimStatus from './components/ClaimStatus';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-claim" element={<ClaimForm />} />
            <Route path="/claim-status/:claimId" element={<ClaimStatus />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
