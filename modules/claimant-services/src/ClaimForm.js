import React, { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box } from '@mui/material';
import { claimsAPI } from './api';

const ClaimForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    ssnLast4: '',
    phone: '',
    email: '',
    lastEmployerName: '',
    employmentEndDate: '',
    separationReason: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Use the API abstraction instead of direct axios call
      const response = await claimsAPI.submitClaim(formData);
      
      alert(`Claim submitted successfully! 
        Claim ID: ${response.claimId}
        Weekly Benefit: ${response.weeklyBenefitAmount}
        Status: ${response.status}`);
      
      // Reset form
      setFormData({
        fullName: '',
        ssnLast4: '',
        phone: '',
        email: '',
        lastEmployerName: '',
        employmentEndDate: '',
        separationReason: ''
      });
    } catch (error) {
      alert('Error submitting claim: ' + error.message);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            File Unemployment Claim
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="SSN (Last 4 digits)"
              name="ssnLast4"
              value={formData.ssnLast4}
              onChange={handleChange}
              margin="normal"
              inputProps={{ maxLength: 4 }}
              required
            />
            
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Last Employer Name"
              name="lastEmployerName"
              value={formData.lastEmployerName}
              onChange={handleChange}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Employment End Date"
              name="employmentEndDate"
              type="date"
              value={formData.employmentEndDate}
              onChange={handleChange}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              required
            />
            
            <TextField
              fullWidth
              label="Reason for Separation"
              name="separationReason"
              value={formData.separationReason}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={3}
              required
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
            >
              Submit Claim
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default ClaimForm;
