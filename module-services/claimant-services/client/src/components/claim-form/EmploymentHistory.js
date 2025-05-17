import React, { useState } from 'react';
import { 
  Grid, 
  TextField, 
  Typography, 
  Box, 
  Paper, 
  Button, 
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/lab';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

function EmploymentHistory({ formData, updateFormData }) {
  const handleChange = (index, field, value) => {
    const updatedHistory = [...formData.employmentHistory];
    updatedHistory[index] = {
      ...updatedHistory[index],
      [field]: value
    };
    
    updateFormData({ employmentHistory: updatedHistory });
  };
  
  const handleDateChange = (index, field, date) => {
    const updatedHistory = [...formData.employmentHistory];
    updatedHistory[index] = {
      ...updatedHistory[index],
      [field]: date.toISOString()
    };
    
    updateFormData({ employmentHistory: updatedHistory });
  };
  
  const addEmployer = () => {
    const updatedHistory = [...formData.employmentHistory];
    updatedHistory.push({
      employerId: '',
      employerName: '',
      startDate: '',
      endDate: '',
      wages: 0,
      position: ''
    });
    
    updateFormData({ employmentHistory: updatedHistory });
  };
  
  const removeEmployer = (index) => {
    if (formData.employmentHistory.length === 1) {
      return; // Don't remove the last employer
    }
    
    const updatedHistory = [...formData.employmentHistory];
    updatedHistory.splice(index, 1);
    
    updateFormData({ employmentHistory: updatedHistory });
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Employment History
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Please provide information about your most recent employers, starting with the most recent. Include all employers from the last 18 months.
      </Typography>
      
      {formData.employmentHistory.map((employer, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1">
              Employer #{index + 1}
            </Typography>
            <IconButton 
              aria-label="delete" 
              onClick={() => removeEmployer(index)}
              disabled={formData.employmentHistory.length === 1}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id={`employer-${index}-name`}
                label="Employer Name"
                fullWidth
                value={employer.employerName || ''}
                onChange={(e) => handleChange(index, 'employerName', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id={`employer-${index}-id`}
                label="Employer ID (if known)"
                fullWidth
                value={employer.employerId || ''}
                onChange={(e) => handleChange(index, 'employerId', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Start Date"
                value={employer.startDate ? new Date(employer.startDate) : null}
                onChange={(date) => handleDateChange(index, 'startDate', date)}
                renderInput={(params) => (
                  <TextField {...params} required fullWidth />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="End Date"
                value={employer.endDate ? new Date(employer.endDate) : null}
                onChange={(date) => handleDateChange(index, 'endDate', date)}
                renderInput={(params) => (
                  <TextField {...params} required fullWidth />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id={`employer-${index}-position`}
                label="Position/Title"
                fullWidth
                value={employer.position || ''}
                onChange={(e) => handleChange(index, 'position', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id={`employer-${index}-wages`}
                label="Wages ($/month)"
                type="number"
                fullWidth
                value={employer.wages || 0}
                onChange={(e) => handleChange(index, 'wages', e.target.value)}
                InputProps={{
                  startAdornment: <Box component="span" sx={{ mr: 1 }}>$</Box>,
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      ))}
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={addEmployer}
        >
          Add Another Employer
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Providing accurate employment information helps us process your claim faster. Make sure to include all employers from the last 18 months, even if you worked for them for a short period.
      </Typography>
    </Box>
  );
}

export default EmploymentHistory;