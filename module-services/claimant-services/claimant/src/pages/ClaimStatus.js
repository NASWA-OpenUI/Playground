import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  CircularProgress, 
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import { GET_CLAIM } from '../graphql/queries';
import ClaimStatusChip from '../components/ClaimStatusChip';

function ClaimStatus() {
  const { id } = useParams();
  const [activeStep, setActiveStep] = useState(0);
  
  const { loading, error, data, refetch } = useQuery(GET_CLAIM, {
    variables: { id },
    fetchPolicy: 'network-only',
  });
  
  useEffect(() => {
    // Refetch claim data when component mounts
    refetch();
    
    // Poll for updates every 10 seconds
    const intervalId = setInterval(() => {
      refetch();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [refetch]);
  
  useEffect(() => {
    // Set active step based on claim status
    if (data && data.getClaimById) {
      const { status } = data.getClaimById;
      if (status === 'Submitted') {
        setActiveStep(0);
      } else if (status === 'InProcess') {
        setActiveStep(1);
      } else if (status === 'WaitingEmployerInfo') {
        setActiveStep(2);
      } else if (status === 'Approved') {
        setActiveStep(3);
      } else if (status === 'Denied') {
        setActiveStep(3);
      }
    }
  }, [data]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message || 'Failed to load claim details'}
        </Alert>
      </Container>
    );
  }
  
  if (!data || !data.getClaimById) {
    return (
      <Container maxWidth="md">
        <Alert severity="warning">
          Claim not found
        </Alert>
      </Container>
    );
  }
  
  const claim = data.getClaimById;
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Claim #{claim.claimId}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Status:
          </Typography>
          <ClaimStatusChip status={claim.status} />
        </Box>
        <Typography variant="body1" color="text.secondary">
          Filed on {formatDate(claim.submissionDate)}
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Claim Progress
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              <Step>
                <StepLabel>Claim Submitted</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Your claim has been received and is awaiting review.
                  </Typography>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Claim Processing</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    Your claim is being processed by our system.
                  </Typography>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Employer Verification</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    We are waiting for your previous employer to verify your employment details.
                  </Typography>
                </StepContent>
              </Step>
              <Step>
                <StepLabel>Determination</StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    A determination has been made on your claim.
                  </Typography>
                </StepContent>
              </Step>
            </Stepper>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Timeline
            </Typography>
            <Timeline>
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot color="primary" />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="body1">Claim Submitted</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(claim.submissionDate)}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
              {claim.status !== 'Submitted' && (
                <TimelineItem>
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body1">Claim Processing Started</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(new Date(new Date(claim.submissionDate).getTime() + 3600000))}
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              )}
              {claim.status === 'WaitingEmployerInfo' && (
                <TimelineItem>
                  <TimelineSeparator>
                    <TimelineDot color="primary" />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="body1">Employer Verification Requested</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(new Date(new Date(claim.submissionDate).getTime() + 7200000))}
                    </Typography>
                  </TimelineContent>
                </TimelineItem>
              )}
            </Timeline>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Claim Details
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Separation Information
              </Typography>
              <Typography variant="body1">
                Reason for Separation: {claim.separationReason}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" component="h3" gutterBottom>
              Employment History
            </Typography>
            {claim.employmentHistory.map((job, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" component="h4" gutterBottom>
                    {job.employerName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {job.position}
                  </Typography>
                  <Typography variant="body2">
                    {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2">
                    Wages: {formatCurrency(job.wages)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Next Steps
            </Typography>
            {claim.status === 'Submitted' && (
              <Typography variant="body1">
                Your claim is being reviewed. Please allow 24-48 hours for processing to begin.
              </Typography>
            )}
            {claim.status === 'InProcess' && (
              <Typography variant="body1">
                Your claim is currently being processed. We may contact your previous employer to verify your employment details.
              </Typography>
            )}
            {claim.status === 'WaitingEmployerInfo' && (
              <Typography variant="body1">
                We are waiting for your previous employer to verify your employment details. This typically takes 5-7 business days.
              </Typography>
            )}
            {claim.status === 'Approved' && (
              <Typography variant="body1">
                Your claim has been approved. You will receive your first payment within 3-5 business days.
              </Typography>
            )}
            {claim.status === 'Denied' && (
              <Typography variant="body1">
                Your claim has been denied. You will receive a letter explaining the reason for the denial and your appeal rights.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ClaimStatus;