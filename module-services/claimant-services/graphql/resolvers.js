const Claim = require('../models/Claim');
const { v4: uuidv4 } = require('uuid');
const camelService = require('../services/camel');

const resolvers = {
  // Queries
  getClaim: async ({ claimId }) => {
    try {
      const claim = await Claim.findOne({ claimId });
      if (!claim) {
        throw new Error(`Claim with ID ${claimId} not found`);
      }
      return formatClaim(claim);
    } catch (error) {
      console.error('Error fetching claim:', error);
      throw error;
    }
  },

  getClaimsByUser: async ({ userId }) => {
    try {
      const claims = await Claim.find({ userId }).sort({ submissionTimestamp: -1 });
      return claims.map(formatClaim);
    } catch (error) {
      console.error('Error fetching claims for user:', error);
      throw error;
    }
  },

  getClaimStatus: async ({ claimId }) => {
    try {
      const claim = await Claim.findOne({ claimId });
      if (!claim) {
        throw new Error(`Claim with ID ${claimId} not found`);
      }
      return claim.status;
    } catch (error) {
      console.error('Error fetching claim status:', error);
      throw error;
    }
  },

  health: () => {
    return `Claimant Services GraphQL API is running - ${new Date().toISOString()}`;
  },

  // Mutations
  createClaim: async ({ input }) => {
    try {
      // Generate unique IDs
      const claimId = `CLM-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const userId = uuidv4();

      // Create new claim
      const claim = new Claim({
        claimId,
        userId,
        ...input,
        status: 'submitted',
        submissionTimestamp: new Date(),
        statusHistory: [{
          status: 'submitted',
          timestamp: new Date(),
          notes: 'Claim initially submitted'
        }]
      });

      const savedClaim = await claim.save();
      console.log(`✅ New claim created: ${claimId}`);
      
      // Now send the claim to the Camel Gateway using natural claimant-services format
      try {
        console.log(`🔄 Notifying gateway of new claim ${claimId}...`);
        const gatewayResponse = await camelService.sendClaimToGateway(savedClaim);
        
        if (gatewayResponse.success) {
          console.log(`✅ Successfully notified gateway of claim ${claimId}`);
          
          // Update the claim with gateway notification status
          savedClaim.statusHistory.push({
            status: savedClaim.status,
            timestamp: new Date(),
            notes: 'Claim successfully sent to gateway for processing'
          });
          await savedClaim.save();
        } else {
          console.error(`❌ Failed to notify gateway of claim ${claimId}: ${gatewayResponse.error}`);
          
          // Record the failure in the claim history but don't fail the overall operation
          savedClaim.statusHistory.push({
            status: savedClaim.status,
            timestamp: new Date(),
            notes: `Gateway notification failed: ${gatewayResponse.error}`
          });
          await savedClaim.save();
        }
      } catch (camelError) {
        console.error(`❌ Error sending claim to gateway: ${camelError.message}`);
        // We don't want to fail the claim submission if gateway is unavailable,
        // but we should log the error and record it in the claim history
        savedClaim.statusHistory.push({
          status: savedClaim.status,
          timestamp: new Date(),
          notes: `Gateway communication error: ${camelError.message}`
        });
        await savedClaim.save();
      }
      
      return formatClaim(savedClaim);
    } catch (error) {
      console.error('❌ Error creating claim:', error);
      throw new Error(`Failed to create claim: ${error.message}`);
    }
  },

  updateClaimStatus: async ({ claimId, status, notes }) => {
    try {
      const claim = await Claim.findOne({ claimId });
      if (!claim) {
        throw new Error(`Claim with ID ${claimId} not found`);
      }

      // Validate status
      const validStatuses = ['submitted', 'processing', 'waitingForEmployer', 'approved', 'denied'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      claim.status = status;
      if (notes) {
        claim.statusHistory.push({
          status,
          timestamp: new Date(),
          notes
        });
      }

      const updatedClaim = await claim.save();
      console.log(`✅ Claim ${claimId} status updated to: ${status}`);
      
      return formatClaim(updatedClaim);
    } catch (error) {
      console.error('❌ Error updating claim status:', error);
      throw error;
    }
  },

  updateBenefitAmounts: async ({ claimId, weeklyAmount, maximumAmount }) => {
    try {
      const claim = await Claim.findOne({ claimId });
      if (!claim) {
        throw new Error(`Claim with ID ${claimId} not found`);
      }

      claim.weeklyBenefitAmount = weeklyAmount;
      claim.maximumBenefitAmount = maximumAmount;
      claim.statusHistory.push({
        status: claim.status,
        timestamp: new Date(),
        notes: `Benefit amounts calculated: Weekly $${weeklyAmount}, Maximum $${maximumAmount}`
      });

      const updatedClaim = await claim.save();
      console.log(`✅ Claim ${claimId} benefit amounts updated: Weekly $${weeklyAmount}, Maximum $${maximumAmount}`);
      
      return formatClaim(updatedClaim);
    } catch (error) {
      console.error('❌ Error updating benefit amounts:', error);
      throw error;
    }
  }
};

// Helper function to format claim data for GraphQL response
function formatClaim(claim) {
  return {
    id: claim._id.toString(),
    claimId: claim.claimId,
    userId: claim.userId,
    firstName: claim.firstName,
    lastName: claim.lastName,
    ssn: claim.ssn,
    dateOfBirth: claim.dateOfBirth.toISOString().split('T')[0], // Format as YYYY-MM-DD
    email: claim.email,
    phone: claim.phone,
    address: claim.address,
    employer: claim.employer,
    employmentDates: {
      startDate: claim.employmentDates.startDate.toISOString().split('T')[0],
      endDate: claim.employmentDates.endDate.toISOString().split('T')[0]
    },
    separationReason: claim.separationReason,
    separationDetails: claim.separationDetails || '',
    wageData: claim.wageData,
    status: claim.status,
    statusDisplayName: claim.getStatusDisplayName(),
    weeklyBenefitAmount: claim.weeklyBenefitAmount,
    maximumBenefitAmount: claim.maximumBenefitAmount,
    submissionTimestamp: claim.submissionTimestamp.toISOString(),
    lastUpdated: claim.lastUpdated.toISOString(),
    statusHistory: claim.statusHistory.map(entry => ({
      status: entry.status,
      timestamp: entry.timestamp.toISOString(),
      notes: entry.notes || ''
    }))
  };
}

module.exports = resolvers;