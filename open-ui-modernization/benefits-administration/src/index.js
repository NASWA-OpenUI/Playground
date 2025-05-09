const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// In-memory store for benefit calculations
const benefitCalculations = [];

// Calculate benefits for a claim
app.post('/api/benefits/calculate', async (req, res) => {
  try {
    const { claimId, quarterlyWages, benefitRate } = req.body;
    console.log(`Calculating benefits for claim ${claimId} with wages ${quarterlyWages} and rate ${benefitRate}`);
    
    // Simple calculation logic
    const weeklyBenefit = Math.round(quarterlyWages * benefitRate);
    
    // Apply min/max bounds
    const minWeeklyBenefit = 50;
    const maxWeeklyBenefit = 450;
    
    let finalBenefit = weeklyBenefit;
    if (weeklyBenefit < minWeeklyBenefit) {
      finalBenefit = minWeeklyBenefit;
    } else if (weeklyBenefit > maxWeeklyBenefit) {
      finalBenefit = maxWeeklyBenefit;
    }
    
    // Calculate maximum total benefit (26 weeks standard)
    const maxTotalBenefit = finalBenefit * 26;
    
    // Store the calculation
    const calculationId = Date.now().toString();
    const calculation = {
      id: calculationId,
      claimId,
      quarterlyWages,
      benefitRate,
      weeklyBenefit: finalBenefit,
      maxTotalBenefit,
      createdAt: new Date().toISOString(),
      status: 'APPROVED'
    };
    
    benefitCalculations.push(calculation);
    
    // Update claim status with benefits calculation
    try {
      await axios.put(`http://claims-processing:3001/api/claims/${claimId}`, {
        status: 'MONETARY_DETERMINATION_COMPLETE',
        weeklyBenefit: finalBenefit,
        maxTotalBenefit
      });
      console.log(`Updated claim ${claimId} status to MONETARY_DETERMINATION_COMPLETE`);
    } catch (error) {
      console.error('Error updating claim with benefit calculation:', error.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Benefit calculation completed',
      calculation
    });
  } catch (error) {
    console.error('Error calculating benefits:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating benefits'
    });
  }
});

// Get benefit calculation for a claim
app.get('/api/benefits/calculations/:claimId', (req, res) => {
  const { claimId } = req.params;
  
  const calculation = benefitCalculations.find(c => c.claimId === claimId);
  if (!calculation) {
    return res.status(404).json({
      success: false,
      message: 'Benefit calculation not found'
    });
  }
  
  res.json({
    success: true,
    calculation
  });
});

app.listen(port, () => {
  console.log(`Benefits Administration Service listening at http://localhost:${port}`);
});