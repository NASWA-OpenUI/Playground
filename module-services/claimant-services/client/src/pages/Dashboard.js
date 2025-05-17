import React, { useContext, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { 
  Box, 
  Button, 
  Container, 
  Paper, 
  Typography, 
  CircularProgress, 
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { GET_CLAIMS_BY_USER } from '../graphql/queries';
import UserContext from '../context/UserContext';
import ClaimStatusChip from '../components/ClaimStatusChip';

function Dashboard() {
  const { user } = useContext(UserContext);
  
  const { loading, error, data, refetch } = useQuery(GET_CLAIMS_BY_USER, {
    variables: { userId: user.id },
    fetchPolicy: 'network-only',
  });
  
  useEffect(() => {
    // Refetch claims when component mounts
    refetch();
  }, [refetch]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          My Dashboard
        </Typography>
        <Button
          component={RouterLink}
          to="/claim/new"
          variant="contained"
          color="primary"
        >
          File New Claim
        </Button>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          My Claims
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">
            {error.message || 'Failed to load claims'}
          </Alert>
        ) : !data || !data.getClaimsByUser || data.getClaimsByUser.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              You haven't filed any unemployment claims yet.
            </Typography>
            <Button
              component={RouterLink}
              to="/claim/new"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              File Your First Claim
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {data.getClaimsByUser.map((claim) => (
              <Grid item xs={12} md={6} key={claim.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" component="h3">
                        Claim #{claim.claimId}
                      </Typography>
                      <ClaimStatusChip status={claim.status} />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Filed on {formatDate(claim.submissionDate)}
                    </Typography>
                    <Typography variant="body2">
                      Separation Reason: {claim.separationReason}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      component={RouterLink}
                      to={`/claim/${claim.claimId}`}
                      size="small"
                      color="primary"
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Resources
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Eligibility Requirements
                </Typography>
                <Typography variant="body2">
                  Learn about unemployment insurance eligibility requirements and how benefits are calculated.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  Learn More
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Job Search Resources
                </Typography>
                <Typography variant="body2">
                  Access job search assistance, resume templates, and interview preparation resources.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  Find Jobs
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Reporting Requirements
                </Typography>
                <Typography variant="body2">
                  Understand your ongoing reporting requirements to maintain eligibility for benefits.
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  View Guidelines
                </Button>
              </CardActions>
            </Card>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default Dashboard;