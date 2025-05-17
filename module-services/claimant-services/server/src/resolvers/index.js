/**
 * GraphQL resolvers for Claimant Services
 */

const User = require('../models/user');
const Claim = require('../models/claim');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// API Gateway converter URL
const CONVERTER_URL = process.env.CONVERTER_URL || 'http://protocol-converter:3000/convert';

const resolvers = {
  Query: {
    getClaimById: async (_, { id }) => {
      try {
        return await Claim.findOne({ claimId: id });
      } catch (error) {
        console.error('Error fetching claim by ID:', error);
        throw new Error('Failed to fetch claim');
      }
    },
    
    getClaimsByUser: async (_, { userId }) => {
      try {
        return await Claim.find({ userId });
      } catch (error) {
        console.error('Error fetching claims by user:', error);
        throw new Error('Failed to fetch claims');
      }
    },
    
    getUserProfile: async (_, { id }) => {
      try {
        return await User.findOne({ userId: id });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        throw new Error('Failed to fetch user profile');
      }
    }
  },
  
  Mutation: {
    submitClaim: async (_, { input }) => {
      try {
        const { userId, employmentHistory, separationReason } = input;
        
        // Check if user exists
        const user = await User.findOne({ userId });
        
        if (!user) {
          return {
            claim: null,
            success: false,
            message: 'User not found'
          };
        }
        
        // Create a new claim
        const newClaim = new Claim({
          claimId: uuidv4(),
          userId,
          employmentHistory: employmentHistory.map(record => ({
            ...record,
            startDate: new Date(record.startDate),
            endDate: new Date(record.endDate)
          })),
          separationReason,
          status: 'Submitted',
          submissionDate: new Date()
        });
        
        // Save claim to database
        const savedClaim = await newClaim.save();
        
        // Send claim to Claims Processing via API Gateway
        try {
          // Prepare GraphQL mutation
          const graphqlMutation = {
            query: `
              mutation SubmitClaim($input: ClaimInput!) {
                submitClaim(input: $input) {
                  claim {
                    claimId
                    status
                  }
                  success
                  message
                }
              }
            `,
            variables: {
              input: {
                userId: savedClaim.userId,
                employmentHistory: savedClaim.employmentHistory.map(record => ({
                  employerId: record.employerId,
                  employerName: record.employerName,
                  startDate: record.startDate.toISOString(),
                  endDate: record.endDate.toISOString(),
                  wages: record.wages,
                  position: record.position
                })),
                separationReason: savedClaim.separationReason
              }
            }
          };
          
          // Send to protocol converter middleware
          const response = await axios.post(CONVERTER_URL, graphqlMutation);
          
          console.log('Claim submitted to Claims Processing via API Gateway:', response.data);
        } catch (error) {
          console.error('Error sending claim to Claims Processing:', error);
          // Continue with claim creation even if API Gateway fails
          // In a production system, we would implement retry logic
        }
        
        return {
          claim: savedClaim,
          success: true,
          message: 'Claim submitted successfully'
        };
      } catch (error) {
        console.error('Error submitting claim:', error);
        return {
          claim: null,
          success: false,
          message: `Failed to submit claim: ${error.message}`
        };
      }
    },
    
    updateClaimStatus: async (_, { id, input }) => {
      try {
        const { status, reason } = input;
        
        // Find claim
        const claim = await Claim.findOne({ claimId: id });
        
        if (!claim) {
          return {
            claim: null,
            success: false,
            message: 'Claim not found'
          };
        }
        
        // Update status
        claim.status = status;
        
        // Save updated claim
        const updatedClaim = await claim.save();
        
        return {
          claim: updatedClaim,
          success: true,
          message: `Claim status updated to ${status}`
        };
      } catch (error) {
        console.error('Error updating claim status:', error);
        return {
          claim: null,
          success: false,
          message: `Failed to update claim status: ${error.message}`
        };
      }
    }
  },
  
  Claim: {
    user: async (claim) => {
      try {
        return await User.findOne({ userId: claim.userId });
      } catch (error) {
        console.error('Error fetching user for claim:', error);
        return null;
      }
    }
  }
};

module.exports = resolvers;