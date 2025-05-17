import React, { useContext, useEffect } from 'react';
import { Grid, TextField, Typography, Box, Paper } from '@mui/material';
import { useQuery } from '@apollo/client';
import { GET_USER_PROFILE } from '../../graphql/queries';
import UserContext from '../../context/UserContext';

function PersonalInfo({ formData, updateFormData }) {
  const { user } = useContext(UserContext);
  
  // Fetch user profile from GraphQL API
  const { data, loading } = useQuery(GET_USER_PROFILE, {
    variables: { id: user.id },
    fetchPolicy: 'network-only',
  });
  
  useEffect(() => {
    // Pre-fill user data when available
    if (data && data.getUserProfile) {
      const { fullName, contactInfo } = data.getUserProfile;
      updateFormData({
        fullName,
        contactInfo
      });
    }
  }, [data, updateFormData]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      updateFormData({
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      updateFormData({ [name]: value });
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Please verify your personal information below. This information will be used to process your unemployment claim.
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              id="fullName"
              name="fullName"
              label="Full Name"
              fullWidth
              value={formData.fullName || ''}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              id="contactInfo.email"
              name="contactInfo.email"
              label="Email Address"
              fullWidth
              value={formData.contactInfo?.email || ''}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              id="contactInfo.phone"
              name="contactInfo.phone"
              label="Phone Number"
              fullWidth
              value={formData.contactInfo?.phone || ''}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Address Information
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              required
              id="contactInfo.address.street"
              name="contactInfo.address.street"
              label="Street Address"
              fullWidth
              value={formData.contactInfo?.address?.street || ''}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              id="contactInfo.address.city"
              name="contactInfo.address.city"
              label="City"
              fullWidth
              value={formData.contactInfo?.address?.city || ''}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <TextField
              required
              id="contactInfo.address.state"
              name="contactInfo.address.state"
              label="State"
              fullWidth
              value={formData.contactInfo?.address?.state || ''}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <TextField
              required
              id="contactInfo.address.zip"
              name="contactInfo.address.zip"
              label="ZIP Code"
              fullWidth
              value={formData.contactInfo?.address?.zip || ''}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Please ensure your contact information is up-to-date. All communication regarding your claim will be sent to the provided email and address.
      </Typography>
    </Box>
  );
}

export default PersonalInfo;