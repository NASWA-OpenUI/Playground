import React from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  FormControl, 
  FormLabel, 
  TextField
} from '@mui/material';

function SeparationReason({ formData, updateFormData }) {
  const handleChange = (e) => {
    updateFormData({ separationReason: e.target.value });
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Reason for Separation
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Please select the reason you are no longer working with your most recent employer. This information will be used to determine your eligibility for unemployment benefits.
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Separation Reason</FormLabel>
          <RadioGroup
            aria-label="separation-reason"
            name="separationReason"
            value={formData.separationReason || ''}
            onChange={handleChange}
          >
            <FormControlLabel value="Layoff" control={<Radio />} label="Layoff (Reduction in Force)" />
            <Box sx={{ ml: 4, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                You were laid off due to lack of work, company downsizing, or business closure.
              </Typography>
            </Box>
            
            <FormControlLabel value="Termination" control={<Radio />} label="Termination" />
            <Box sx={{ ml: 4, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                You were fired or let go by your employer.
              </Typography>
            </Box>
            
            <FormControlLabel value="Resignation" control={<Radio />} label="Resignation" />
            <Box sx={{ ml: 4, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                You voluntarily quit your job.
              </Typography>
            </Box>
            
            <FormControlLabel value="Other" control={<Radio />} label="Other" />
            <Box sx={{ ml: 4, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                None of the above applies to your situation.
              </Typography>
            </Box>
          </RadioGroup>
        </FormControl>
        
        {formData.separationReason === 'Other' && (
          <TextField
            label="Please explain"
            multiline
            rows={4}
            fullWidth
            margin="normal"
            variant="outlined"
          />
        )}
      </Paper>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        <strong>Important:</strong> Your reason for separation affects your eligibility for unemployment benefits. If you were laid off due to no fault of your own, you are typically eligible for benefits. If you voluntarily quit or were fired for misconduct, additional information may be required to determine your eligibility.
      </Typography>
    </Box>
  );
}

export default SeparationReason;