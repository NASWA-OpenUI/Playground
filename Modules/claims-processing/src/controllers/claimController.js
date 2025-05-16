// Modules/claims-processing/src/controllers/claimController.js
const { v4: uuidv4 } = require('uuid');
const employerService = require('../services/employerService');
const benefitsService = require('../services/benefitsService');

// In-memory data store (for demo purposes only)
const claims = {};

// Create a new claim
exports.createClaim = async (req, res, next) => {
  try {
    const claimData = req.body;
    
    // Generate a unique claim ID
    const claimId = 'C' + Math.floor(100000 + Math.random() * 900000);
    
    // Create the claim record
    const claim = {
      claimId,
      claimantId: claimData.claimantId,
      firstName: claimData.firstName,
      lastName: claimData.lastName,
      ssn: claimData.ssn,
      address: claimData.address,
      contactInfo: claimData.contactInfo,
      employmentHistory: claimData.employmentHistory,
      filingDate: claimData.filingDate || new Date().toISOString(),
      status: 'Submitted',
      statusDate: new Date().toISOString(),
      benefitAmount: null,
      messages: ['Your claim has been received and is being processed.']
    };
    
    // Store the claim
    claims[claimId] = claim;
    
    // Initiate employer verification process
    setTimeout(() => {
      this.requestEmployerVerification({ params: { claimId } }, { status: () => ({ json: () => {} }) }, next);
    }, 2000);
    
    // Return the claim ID and status
    res.status(201).json({
      claimId,
      status: claim.status
    });
  } catch (error) {
    next(error);
  }
};

// Get all claims
exports.getAllClaims = (req, res) => {
  const claimsList = Object.values(claims);
  res.json(claimsList);
};

// Get claim by ID
exports.getClaimById = (req, res) => {
  const { claimId } = req.params;
  const claim = claims[claimId];
  
  if (!claim) {
    return res.status(404).json({ message: 'Claim not found' });
  }
  
  res.json(claim);
};

// Get claim status
exports.getClaimStatus = (req, res) => {
  const { claimId } = req.params;
  const claim = claims[claimId];
  
  if (!claim) {
    return res.status(404).json({ message: 'Claim not found' });
  }
  
  res.json({
    claimId: claim.claimId,
    status: claim.status,
    statusDate: claim.statusDate,
    benefitAmount: claim.benefitAmount,
    messages: claim.messages
  });
};

// Update claim status
exports.updateClaimStatus = (req, res) => {
  const { claimId } = req.params;
  const { status, message } = req.body;
  
  const claim = claims[claimId];
  
  if (!claim) {
    return res.status(404).json({ message: 'Claim not found' });
  }
  
  claim.status = status;
  claim.statusDate = new Date().toISOString();
  
  if (message) {
    claim.messages = [...claim.messages, message];
  }
  
  res.json({
    claimId: claim.claimId,
    status: claim.status,
    statusDate: claim.statusDate,
    messages: claim.messages
  });
};

// Request employer verification
exports.requestEmployerVerification = async (req, res, next) => {
  try {
    const { claimId } = req.params;
    const claim = claims[claimId];
    
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    
    // Update claim status
    claim.status = 'AwaitingEmployerInfo';
    claim.statusDate = new Date().toISOString();
    claim.messages.push('Employer verification has been requested.');
    
    // For each employer in employment history, send verification request
    for (const employment of claim.employmentHistory) {
      try {
        // Normally we'd call the employer service API here
        // For demo purposes, we'll just log the request
        console.log(`Sending verification request to employer ${employment.employerId} for claim ${claimId}`);
        
        // Mock employer service call
        await employerService.requestVerification({
          claimId,
          employerId: employment.employerId,
          claimantName: `${claim.firstName} ${claim.lastName}`,
          claimantSSNLast4: claim.ssn,
          claimedEmploymentPeriod: {
            startDate: employment.startDate,
            endDate: employment.endDate
          }
        });
      } catch (error) {
        console.error(`Error requesting verification from employer ${employment.employerId}:`, error);
        // Continue with next employer even if one fails
      }
    }
    
    // If this was called directly as an endpoint
    if (res.status) {
      res.json({
        claimId: claim.claimId,
        status: claim.status,
        message: 'Employer verification requests have been sent.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Process employer verification
exports.processEmployerVerification = async (req, res, next) => {
  try {
    const { claimId } = req.params;
    const verificationData = req.body;
    
    const claim = claims[claimId];
    
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    
    console.log(`Received employer verification for claim ${claimId}:`, verificationData);
    
    // Find the matching employment record
    const employmentIndex = claim.employmentHistory.findIndex(
      e => e.employerId === verificationData.employerId
    );
    
    if (employmentIndex === -1) {
      return res.status(400).json({ message: 'Employer not found in claim employment history' });
    }
    
    // Update the employment record with verification data
    claim.employmentHistory[employmentIndex] = {
      ...claim.employmentHistory[employmentIndex],
      verified: true,
      verificationStatus: verificationData.verificationStatus,
      verificationDate: new Date().toISOString()
    };
    
    // If verification includes employment details, update those too
    if (verificationData.employmentDetails) {
      claim.employmentHistory[employmentIndex].verifiedDetails = verificationData.employmentDetails;
    }
    
    // Update claim status
    claim.status = 'Processing';
    claim.statusDate = new Date().toISOString();
    claim.messages.push('Employer verification received.');
    
    // If all employers have verified, proceed to benefit calculation
    const allVerified = claim.employmentHistory.every(e => e.verified);
    
    if (allVerified) {
      // Proceed to benefit calculation
      setTimeout(() => {
        this.calculateBenefits({ params: { claimId } }, { json: () => {} }, next);
      }, 1000);
    }
    
    res.json({
      claimId: claim.claimId,
      status: claim.status,
      message: 'Employer verification processed.'
    });
  } catch (error) {
    next(error);
  }
};

// Calculate benefits
exports.calculateBenefits = async (req, res, next) => {
  try {
    const { claimId } = req.params;
    const claim = claims[claimId];
    
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    
    // Prepare employment data for benefit calculation
    const employmentData = claim.employmentHistory.map(employment => {
      // Use verified details if available, otherwise use claimed details
      const details = employment.verifiedDetails || {};
      
      return {
        employerId: employment.employerId,
        wageRate: details.wageRate || 0, // Default to 0 if not provided
        payFrequency: details.payFrequency || 'Weekly',
        hoursPerWeek: details.hoursPerWeek || 40,
        startDate: details.startDate || employment.startDate,
        endDate: details.endDate || employment.endDate
      };
    });
    
    // Call benefits service for calculation
    try {
      const benefitResult = await benefitsService.calculateBenefits({
        claimId,
        claimantId: claim.claimantId,
        employmentHistory: employmentData
      });
      
      // Update claim with benefit information
      claim.benefitAmount = benefitResult.weeklyBenefitAmount;
      claim.maximumBenefitAmount = benefitResult.maximumBenefitAmount;
      claim.benefitYear = benefitResult.benefitYear;
      claim.taxWithholdingRate = benefitResult.taxWithholdingRate;
      claim.netWeeklyBenefitAmount = benefitResult.netWeeklyBenefitAmount;
      
      // Update claim status
      claim.status = 'Approved';
      claim.statusDate = new Date().toISOString();
      claim.messages.push('Your claim has been approved. Benefit calculation is complete.');
      
    } catch (error) {
      console.error('Error calculating benefits:', error);
      
      // Update claim with error status
      claim.status = 'Processing';
      claim.statusDate = new Date().toISOString();
      claim.messages.push('There was an issue calculating benefits. Our team is reviewing your claim.');
      
      throw error;
    }
    
    // If this was called directly as an endpoint
    if (res.json) {
      res.json({
        claimId: claim.claimId,
        status: claim.status,
        benefitAmount: claim.benefitAmount,
        message: 'Benefit calculation is complete.'
      });
    }
  } catch (error) {
    next(error);
  }
};
