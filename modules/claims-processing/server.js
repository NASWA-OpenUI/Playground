const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3002;
const KONG_URL = process.env.KONG_URL || 'http://localhost:8000';

app.use(express.json());

// In-memory storage for demo purposes
const claims = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Claims Processing Service is running' });
});

// Create new claim
app.post('/api/new-claim', async (req, res) => {
  try {
    const claimId = uuidv4();
    const {
      claimantName,
      ssnLast4,
      phone,
      email,
      employerName,
      separationDate,
      separationReason
    } = req.body;

    console.log('Processing new claim for:', claimantName);

    // Step 1: Get wage data from Employer Services
    let wageData;
    try {
      const employerResponse = await axios.get(
        `${KONG_URL}/employer/api/wages/${ssnLast4}/${employerName}`
      );
      wageData = employerResponse.data;
    } catch (error) {
      console.error('Error fetching wage data:', error.message);
      // Use mock data if employer service is not available
      wageData = {
        quarters: [
          { quarter: 'Q1', wages: 12000 },
          { quarter: 'Q2', wages: 13000 },
          { quarter: 'Q3', wages: 13500 },
          { quarter: 'Q4', wages: 14000 }
        ],
        totalWages: 52500
      };
    }

    // Step 2: Calculate benefit amount using Business Rules Engine
    let benefitCalculation;
    try {
      const rulesResponse = await axios.post(
        `${KONG_URL}/rules/api/calculate-benefit`,
        { totalWages: wageData.totalWages }
      );
      benefitCalculation = rulesResponse.data;
    } catch (error) {
      console.error('Error calculating benefits:', error.message);
      // Fallback calculation
      benefitCalculation = {
        weeklyBenefitAmount: Math.min(Math.max(wageData.totalWages / 52 * 0.5, 50), 450),
        maxBenefitAmount: Math.min(Math.max(wageData.totalWages / 52 * 0.5, 50), 450) * 26
      };
    }

    // Create claim record
    const claim = {
      claimId,
      claimantName,
      ssnLast4,
      phone,
      email,
      employerName,
      separationDate,
      separationReason,
      wageData,
      benefitCalculation,
      status: 'APPROVED',
      createdAt: new Date().toISOString()
    };

    claims.set(claimId, claim);

    // Step 3: Send to Benefits Administration
    try {
      await axios.post(`${KONG_URL}/benefits/api/authorize-payment`, {
        claimId,
        claimantName,
        weeklyBenefitAmount: benefitCalculation.weeklyBenefitAmount,
        maxBenefitAmount: benefitCalculation.maxBenefitAmount
      });
    } catch (error) {
      console.error('Error authorizing payment:', error.message);
    }

    res.json({
      claimId,
      status: 'APPROVED',
      weeklyBenefitAmount: benefitCalculation.weeklyBenefitAmount,
      maxBenefitAmount: benefitCalculation.maxBenefitAmount,
      message: 'Claim processed successfully'
    });

  } catch (error) {
    console.error('Error processing claim:', error);
    res.status(500).json({ error: 'Failed to process claim' });
  }
});

// Get claim by ID
app.get('/api/claim/:claimId', (req, res) => {
  const claim = claims.get(req.params.claimId);
  if (claim) {
    res.json(claim);
  } else {
    res.status(404).json({ error: 'Claim not found' });
  }
});

// Get all claims (for demo purposes)
app.get('/api/claims', (req, res) => {
  res.json(Array.from(claims.values()));
});

app.listen(PORT, () => {
  console.log(`Claims Processing Service running on port ${PORT}`);
});
