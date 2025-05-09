const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3004;

app.use(cors());
app.use(express.json());

// In-memory store for employers
const employers = [
  { id: 'EMP001', name: 'Acme Industries', taxId: '12-3456789' },
  { id: 'EMP002', name: 'TechCorp Inc', taxId: '98-7654321' }
];

// In-memory store for pending claim verifications
const pendingVerifications = [];

// Get employer information
app.get('/api/employer/:employerId', (req, res) => {
  const { employerId } = req.params;
  const employer = employers.find(e => e.id === employerId);
  
  if (!employer) {
    return res.status(404).json({
      success: false,
      message: 'Employer not found'
    });
  }
  
  res.json({
    success: true,
    employer
  });
});

// Endpoint to receive claim verification requests
app.post('/api/employer/verifications', (req, res) => {
  const { claimId, employerId, claimantName, claimantSSN, lastWorkDate } = req.body;
  
  console.log(`Received verification request for claim ${claimId} from employer ${employerId}`);
  
  // Check if employer exists
  const employer = employers.find(e => e.id === employerId);
  if (!employer) {
    return res.status(404).json({
      success: false,
      message: 'Employer not found'
    });
  }
  
  // Create verification request
  const verificationId = Date.now().toString();
  
  pendingVerifications.push({
    id: verificationId,
    claimId,
    employerId,
    claimantName,
    claimantSSN,
    lastWorkDate,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  });
  
  res.status(201).json({
    success: true,
    message: 'Verification request received',
    verificationId
  });
  
  // Auto-verify for the demo (in a real system, the employer would log in and verify)
  setTimeout(async () => {
    try {
      const verification = pendingVerifications.find(v => v.id === verificationId);
      if (verification && verification.status === 'PENDING') {
        verification.status = 'COMPLETED';
        verification.response = { verified: true, reason: 'Verified automatically for demo purposes' };
        verification.respondedAt = new Date().toISOString();
        
        console.log(`Auto-verifying claim ${claimId} for demo purposes`);
        
        // Send verification to claims processing
        await axios.post(`http://claims-processing:3001/api/claims/${verification.claimId}/verify`, {
          verified: true,
          reason: 'Verified automatically for demo purposes'
        });
      }
    } catch (error) {
      console.error('Error in auto-verification:', error.message);
    }
  }, 5000); // Auto-verify after 5 seconds
});

// Get all pending verifications for an employer
app.get('/api/employer/:employerId/verifications', (req, res) => {
  const { employerId } = req.params;
  
  const verifications = pendingVerifications.filter(v => 
    v.employerId === employerId
  );
  
  res.json({
    success: true,
    verifications
  });
});

// Submit a verification response
app.post('/api/employer/verifications/:verificationId/respond', async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { verified, reason } = req.body;
    
    const verification = pendingVerifications.find(v => v.id === verificationId);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Verification request not found'
      });
    }
    
    verification.status = 'COMPLETED';
    verification.response = { verified, reason };
    verification.respondedAt = new Date().toISOString();
    
    // Forward the response to claims processing
    try {
      await axios.post(`http://claims-processing:3001/api/claims/${verification.claimId}/verify`, {
        verified,
        reason
      });
      
      res.json({
        success: true,
        message: 'Verification response submitted successfully'
      });
    } catch (error) {
      console.error('Error sending verification to claims processing:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error processing verification response'
      });
    }
  } catch (error) {
    console.error('Error in verification response:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.listen(port, () => {
  console.log(`Employer Service listening at http://localhost:${port}`);
});