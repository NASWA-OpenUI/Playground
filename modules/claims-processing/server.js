const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const graphqlClient = require('./graphqlClient');
const soapClient = require('./soapClient');
const grpcClient = require('./grpcClient');

const app = express();
const PORT = process.env.PORT || 3002;
const KONG_URL = process.env.KONG_URL || 'http://localhost:8000';

// Initialize clients on startup
soapClient.initializeSoapClient();

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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

    // Step 1: Get wage data from Employer Services (GraphQL)
    let wageData;
    try {
      wageData = await graphqlClient.getWages(ssnLast4, employerName);
    } catch (error) {
      console.error('Error fetching wage data:', error.message);
      // Use mock data fallback
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

    // Step 2: Calculate benefit amount using Business Rules Engine (SOAP)
    let benefitCalculation;
    try {
      benefitCalculation = await soapClient.calculateBenefit(wageData.totalWages);
    } catch (error) {
      console.error('Error calculating benefits:', error.message);
      // Fallback calculation
      benefitCalculation = {
        weeklyBenefitAmount: Math.min(Math.max(wageData.totalWages / 52 * 0.5, 50), 450),
        maxBenefitAmount: Math.min(Math.max(wageData.totalWages / 52 * 0.5, 50), 450) * 26,
        taxRateUsed: 0.5,
        formula: 'totalWages / 52 * 0.5'
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

    // Step 3: Send to Benefits Administration (gRPC)
    try {
      await grpcClient.authorizePayment({
        claim_id: claimId,
        claimant_name: claimantName,
        weekly_benefit_amount: benefitCalculation.weeklyBenefitAmount,
        max_benefit_amount: benefitCalculation.maxBenefitAmount
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
