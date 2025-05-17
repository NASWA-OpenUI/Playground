// claims-processing/src/controllers/claims-controller.js
const claimsService = require('../services/claims-service');
const eventBusService = require('../services/event-bus-service');
const rulesService = require('../services/rules-service');
const benefitsService = require('../services/benefits-service');

// In-memory store for claims
let claims = [];
let claimIdCounter = 1000;

/**
 * Get all claims
 */
exports.getAllClaims = (req, res) => {
  try {
    res.json(claims);
  } catch (error) {
    console.error('Error getting claims:', error);
    res.status(500).json({ error: 'Failed to get claims' });
  }
};

/**
 * Get claim by ID
 */
exports.getClaimById = (req, res) => {
  try {
    const { claimId } = req.params;
    const claim = claims.find(c => c.claimId === claimId);
    
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    res.json(claim);
  } catch (error) {
    console.error('Error getting claim:', error);
    res.status(500).json({ error: 'Failed to get claim' });
  }
};

/**
 * Create new claim
 */
exports.createClaim = async (req, res) => {
  try {
    const {
      claimantName,
      ssn,
      lastEmployer,
      employmentDates,
      weeklyWage
    } = req.body;
    
    // Validate required fields
    if (!claimantName || !ssn || !lastEmployer || !employmentDates || !weeklyWage) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate new claim ID
    const claimId = `C${claimIdCounter++}`;
    
    // Create new claim
    const newClaim = {
      claimId,
      claimantName,
      ssn,
      lastEmployer,
      employmentDates,
      weeklyWage: parseFloat(weeklyWage),
      status: 'Processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to claims
    claims.push(newClaim);
    
    // Publish event to event bus
    try {
      await eventBusService.publishEvent('claim.submitted', {
        claimId,
        claimantName,
        lastEmployer,
        status: 'Processing'
      });
    } catch (error) {
      console.error('Error publishing event:', error);
      // Continue even if event publishing fails
    }
    
    // Return created claim
    res.status(201).json({
      message: 'Claim created successfully',
      claim: newClaim
    });
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(500).json({ error: 'Failed to create claim' });
  }
};

/**
 * Update claim
 */
exports.updateClaim = async (req, res) => {
  try {
    const { claimId } = req.params;
    const updateData = req.body;
    
    // Find claim
    const claimIndex = claims.findIndex(c => c.claimId === claimId);
    
    if (claimIndex === -1) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    // Update claim
    const updatedClaim = {
      ...claims[claimIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    claims[claimIndex] = updatedClaim;
    
    // If employer verified the claim
    if (updateData.employerVerified) {
      // Calculate benefit using rules engine
      try {
        const benefitResult = await rulesService.calculateBenefit(
          claimId,
          updatedClaim.weeklyWage
        );
        
        // Update claim with benefit information
        updatedClaim.weeklyBenefit = benefitResult.weeklyBenefit;
        updatedClaim.maxBenefit = benefitResult.maxBenefit;
        updatedClaim.status = 'Approved';
        claims[claimIndex] = updatedClaim;
        
        // Process payment through benefits service
        try {
          await benefitsService.processPayment(claimId, benefitResult.weeklyBenefit);
        } catch (error) {
          console.error('Error processing payment:', error);
          // Continue even if payment processing fails
        }
        
        // Publish event to event bus
        try {
          await eventBusService.publishEvent('claim.approved', {
            claimId,
            status: 'Approved',
            weeklyBenefit: benefitResult.weeklyBenefit,
            maxBenefit: benefitResult.maxBenefit
          });
        } catch (error) {
          console.error('Error publishing event:', error);
          // Continue even if event publishing fails
        }
      } catch (error) {
        console.error('Error processing employer verification:', error);
      }
    }
    
    res.json({
      message: 'Claim updated successfully',
      claim: updatedClaim
    });
  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({ error: 'Failed to update claim' });
  }
};

/**
 * Submit weekly certification
 */
exports.submitCertification = async (req, res) => {
  try {
    const { claimId } = req.params;
    const certificationData = req.body;
    
    // Find claim
    const claimIndex = claims.findIndex(c => c.claimId === claimId);
    
    if (claimIndex === -1) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    // Process certification
    const claim = claims[claimIndex];
    
    // Add certification to claim
    if (!claim.certifications) {
      claim.certifications = [];
    }
    
    const certification = {
      weekEnding: certificationData.weekEnding,
      lookingForWork: certificationData.lookingForWork,
      ableToWork: certificationData.ableToWork,
      earnings: certificationData.earnings || 0,
      status: 'Pending',
      submittedAt: new Date().toISOString()
    };
    
    claim.certifications.push(certification);
    claim.updatedAt = new Date().toISOString();
    
    // Process payment if eligible
    if (certification.lookingForWork && certification.ableToWork) {
      try {
        // Process payment through benefits service
        await benefitsService.processPayment(claimId, claim.weeklyBenefit);
        
        // Update certification status
        certification.status = 'Approved';
        certification.paymentAmount = claim.weeklyBenefit;
        certification.paymentDate = new Date().toISOString();
        
        // Publish event to event bus
        try {
          await eventBusService.publishEvent('certification.approved', {
            claimId,
            weekEnding: certification.weekEnding,
            paymentAmount: certification.paymentAmount
          });
        } catch (error) {
          console.error('Error publishing event:', error);
          // Continue even if event publishing fails
        }
      } catch (error) {
        console.error('Error processing certification payment:', error);
        certification.status = 'Failed';
        certification.statusReason = 'Payment processing failed';
      }
    } else {
      certification.status = 'Denied';
      certification.statusReason = 'Eligibility requirements not met';
    }
    
    res.json({
      message: 'Certification submitted successfully',
      certification
    });
  } catch (error) {
    console.error('Error submitting certification:', error);
    res.status(500).json({ error: 'Failed to submit certification' });
  }
};

/**
 * Get claim status
 */
exports.getClaimStatus = (req, res) => {
  try {
    const { claimId } = req.params;
    const claim = claims.find(c => c.claimId === claimId);
    
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found' });
    }
    
    res.json({
      claimId: claim.claimId,
      status: claim.status,
      weeklyBenefit: claim.weeklyBenefit,
      maxBenefit: claim.maxBenefit,
      lastUpdated: claim.updatedAt
    });
  } catch (error) {
    console.error('Error getting claim status:', error);
    res.status(500).json({ error: 'Failed to get claim status' });
  }
};