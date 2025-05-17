import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import NewClaim from './pages/NewClaim';
import ClaimStatus from './pages/ClaimStatus';
import UserContext from './context/UserContext';

function App() {
  // In a real app, this would be handled by proper authentication
  const [user, setUser] = useState({
    id: 'USER123',
    name: 'John Smith',
    isAuthenticated: true
  });

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/claim/new" element={<NewClaim />} />
            <Route path="/claim/:id" element={<ClaimStatus />} />
          </Routes>
        </Container>
      </Box>
    </UserContext.Provider>
  );
}

export default App;