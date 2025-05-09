const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// In-memory store for claims
const claims = [];

// Submit a new claim
app.post('/api/claims', async (req, res) => {
  try {
    const claimData = req.body;
    console.log('Received new claim:', claimData);
    
    // Generate a claim ID
    const claimId = Date.now().toString();
    
    // Store the claim
    const newClaim = {
      id: claimId,
      ...claimData,
      status: 'PENDING_EMPLOYER_VERIFICATION',
      createdAt: new Date().toISOString()
    };
    
    claims.push(newClaim);
    
    // Notify employer service (in a real implementation)
    try {
      await axios.post('http://employer-service:3004/api/employer/verifications', { 
        claimId,
        employerId: claimData.employerId,
        claimantName: `${claimData.firstName} ${claimData.lastName}`,
        claimantSSN: claimData.ssn,
        lastWorkDate: claimData.lastWorkDate
      });
      console.log(`Employer notification sent for claim ${claimId}`);
    } catch (error) {
      console.error('Error notifying employer:', error.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Claim submitted successfully',
      claimId,
      status: newClaim.status
    });
  } catch (error) {
    console.error('Error processing claim:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing claim'
    });
  }
});

// Get claim status
app.get('/api/claims/:claimId', (req, res) => {
  const { claimId } = req.params;
  const claim = claims.find(c => c.id === claimId);
  
  if (!claim) {
    return res.status(404).json({
      success: false,
      message: 'Claim not found'
    });
  }
  
  res.json({
    success: true,
    claim
  });
});

// Update claim details
app.put('/api/claims/:claimId', (req, res) => {
  const { claimId } = req.params;
  const claim = claims.find(c => c.id === claimId);
  
  if (!claim) {
    return res.status(404).json({
      success: false,
      message: 'Claim not found'
    });
  }
  
  // Update claim with new data
  Object.assign(claim, req.body);
  
  res.json({
    success: true,
    message: 'Claim updated successfully',
    claim
  });
});

// Verify a claim (called by employer service)
app.post('/api/claims/:claimId/verify', async (req, res) => {
  try {
    const { claimId } = req.params;
    const { verified, reason } = req.body;
    
    const claim = claims.find(c => c.id === claimId);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }
    
    claim.employerVerified = verified;
    claim.employerVerificationReason = reason;
    claim.status = verified ? 'PENDING_BENEFIT_CALCULATION' : 'DENIED_BY_EMPLOYER';
    
    // If verified, request benefit calculation
    if (verified) {
      try {
        // Call the rules engine to get the benefit rate
        const rulesResponse = await axios.get('http://rules-engine:3003/api/rules/benefit-calculation');
        const benefitRate = rulesResponse.data.rules[0].event.params.benefitRate;
        
        console.log(`Got benefit rate ${benefitRate} from rules engine`);
        
        // Call benefits administration service
        await axios.post('http://benefits-administration:3002/api/benefits/calculate', {
          claimId,
          quarterlyWages: claim.quarterlyWages,
          benefitRate
        });
        
        console.log(`Benefit calculation requested for claim ${claimId}`);
      } catch (error) {
        console.error('Error requesting benefit calculation:', error.message);
      }
    }
    
    res.json({
      success: true,
      message: `Claim ${verified ? 'verified' : 'denied'} by employer`,
      status: claim.status
    });
  } catch (error) {
    console.error('Error processing verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing verification'
    });
  }
});

app.listen(port, () => {
  console.log(`Claims Processing Service listening at http://localhost:${port}`);
});