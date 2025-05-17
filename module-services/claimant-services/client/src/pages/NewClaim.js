import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel, 
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import PersonalInfo from '../components/claim-form/PersonalInfo';
import EmploymentHistory from '../components/claim-form/EmploymentHistory';
import SeparationReason from '../components/claim-form/SeparationReason';
import Review from '../components/claim-form/Review';
import { SUBMIT_CLAIM } from '../graphql/queries';
import UserContext from '../context/UserContext';

const steps = ['Personal Information', 'Employment History', 'Separation Reason', 'Review'];

function NewClaim() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    userId: user.id,
    employmentHistory: [
      {
        employerId: '',
        employerName: '',
        startDate: '',
        endDate: '',
        wages: 0,
        position: ''
      }
    ],
    separationReason: ''
  });
  const [error, setError] = useState('');
  
  // GraphQL mutation for submitting claim
  const [submitClaim, { loading }] = useMutation(SUBMIT_CLAIM, {
    onCompleted: (data) => {
      if (data.submitClaim.success) {
        navigate(`/claim/${data.submitClaim.claim.claimId}`);
      } else {
        setError(data.submitClaim.message || 'Failed to submit claim');
        setActiveStep(steps.length);
      }
    },
    onError: (error) => {
      console.error('Error submitting claim:', error);
      setError(error.message || 'An unexpected error occurred');
      setActiveStep(steps.length);
    }
  });

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      // Submit the claim
      submitClaim({
        variables: {
          input: {
            userId: formData.userId,
            employmentHistory: formData.employmentHistory.map(job => ({
              ...job,
              wages: parseFloat(job.wages)
            })),
            separationReason: formData.separationReason
          }
        }
      });
    } else {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const updateFormData = (data) => {
    setFormData(prevData => ({ ...prevData, ...data }));
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <PersonalInfo formData={formData} updateFormData={updateFormData} />;
      case 1:
        return <EmploymentHistory formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <SeparationReason formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Review formData={formData} />;
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          File New Unemployment Claim
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {activeStep === steps.length ? (
          <Box sx={{ textAlign: 'center' }}>
            {loading ? (
              <CircularProgress />
            ) : error ? (
              <>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Button onClick={() => setActiveStep(0)} variant="contained">
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h5" gutterBottom>
                  Claim submitted successfully!
                </Typography>
                <Typography variant="subtitle1">
                  Your claim has been submitted and is now being processed.
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <>
            {getStepContent(activeStep)}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              {activeStep !== 0 && (
                <Button onClick={handleBack} sx={{ mr: 1 }}>
                  Back
                </Button>
              )}
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
              >
                {activeStep === steps.length - 1 ? 'Submit Claim' : 'Next'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
}

export default NewClaim;