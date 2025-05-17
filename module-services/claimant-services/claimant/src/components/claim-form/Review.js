import React from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  List, 
  ListItem, 
  ListItemText
} from '@mui/material';

function Review({ formData }) {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format currency for display
  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Claim
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Please review your unemployment claim details below. Make sure all information is accurate before submitting.
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Personal Information
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="Full Name" 
              secondary={formData.fullName || 'Not provided'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Email" 
              secondary={formData.contactInfo?.email || 'Not provided'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Phone" 
              secondary={formData.contactInfo?.phone || 'Not provided'} 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="Address" 
              secondary={
                formData.contactInfo?.address ? 
                `${formData.contactInfo.address.street}, ${formData.contactInfo.address.city}, ${formData.contactInfo.address.state} ${formData.contactInfo.address.zip}` : 
                'Not provided'
              } 
            />
          </ListItem>
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Employment History
        </Typography>
        {formData.employmentHistory && formData.employmentHistory.map((employer, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Typography variant="subtitle2">
              Employer #{index + 1}: {employer.employerName || 'Not provided'}
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Employer ID" 
                  secondary={employer.employerId || 'Not provided'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Position" 
                  secondary={employer.position || 'Not provided'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Employment Period" 
                  secondary={`${formatDate(employer.startDate)} to ${formatDate(employer.endDate)}`} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Monthly Wages" 
                  secondary={formatCurrency(employer.wages)} 
                />
              </ListItem>
            </List>
            {index < formData.employmentHistory.length - 1 && (
              <Divider sx={{ my: 1 }} />
            )}
          </Box>
        ))}
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Separation Reason
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText 
              primary="Reason for Separation" 
              secondary={formData.separationReason || 'Not selected'} 
            />
          </ListItem>
        </List>
      </Paper>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        <strong>Important Notice:</strong> By submitting this claim, you certify that all information provided is true and accurate to the best of your knowledge. Providing false information may result in denial of benefits and potential legal consequences.
      </Typography>
    </Box>
  );
}

export default Review;