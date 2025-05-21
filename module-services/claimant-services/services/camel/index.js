const { gql } = require('graphql-tag');
const { print } = require('graphql');
const axios = require('axios');

// Configuration defaults
const CAMEL_GRAPHQL_URL = process.env.CAMEL_GRAPHQL_URL || 'http://localhost:8080/api/claimant/graphql';
const CAMEL_TIMEOUT = parseInt(process.env.CAMEL_TIMEOUT || '5000', 10);
const CAMEL_RETRY_COUNT = parseInt(process.env.CAMEL_RETRY_COUNT || '3', 10);

// GraphQL mutation for submitting a claim to Camel
const CREATE_CLAIM_MUTATION = gql`
  mutation CreateClaim($input: ClaimInput!) {
    createClaim(input: $input) {
      claimId
      status
      statusDisplayName
      submissionTimestamp
    }
  }
`;

/**
 * Sends claim data to the Camel API Gateway via GraphQL
 * 
 * @param {Object} claim - The claim object to send
 * @returns {Promise<Object>} - The response from the Camel API
 */
async function sendClaimToCamel(claim) {
  try {
    console.log(`Sending claim ${claim.claimId} to Camel API Gateway via GraphQL at ${CAMEL_GRAPHQL_URL}`);
    
    // Transform claim to input format for GraphQL mutation
    const claimInput = formatClaimForGraphQL(claim);
    
    // Prepare the GraphQL mutation
    const graphqlQuery = {
      query: print(CREATE_CLAIM_MUTATION),
      variables: {
        input: claimInput
      }
    };
    
    // Configure the request
    const options = {
      timeout: CAMEL_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Source-Service': 'claimant-services',
        'X-Claim-ID': claim.claimId
      }
    };

    // Send the GraphQL mutation to Camel
    const response = await axios.post(CAMEL_GRAPHQL_URL, graphqlQuery, options);
    
    console.log(`Successfully sent claim ${claim.claimId} to Camel API Gateway. Status: ${response.status}`);
    return {
      success: true,
      status: response.status,
      responseData: response.data,
      claimId: claim.claimId
    };
  } catch (error) {
    console.error(`Error sending claim ${claim.claimId} to Camel API Gateway:`, error.message);
    
    // Error handling logic similar to previous implementation
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        error: error.response.data,
        claimId: claim.claimId
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Connection error: No response from Camel API Gateway',
        claimId: claim.claimId
      };
    } else {
      return {
        success: false,
        error: `Request setup error: ${error.message}`,
        claimId: claim.claimId
      };
    }
  }
}

/**
 * Formats the claim data for GraphQL mutation
 * Converts our MongoDB model to the format expected by the GraphQL schema
 * 
 * @param {Object} claim - The claim object from MongoDB
 * @returns {Object} - Formatted claim data for GraphQL
 */
function formatClaimForGraphQL(claim) {
  // The input format should match our GraphQL schema definition
  return {
    firstName: claim.firstName,
    lastName: claim.lastName,
    ssn: claim.ssn,
    dateOfBirth: claim.dateOfBirth instanceof Date ? 
      claim.dateOfBirth.toISOString().split('T')[0] : claim.dateOfBirth,
    email: claim.email,
    phone: claim.phone,
    address: {
      street: claim.address.street,
      city: claim.address.city,
      state: claim.address.state,
      zipCode: claim.address.zipCode
    },
    employer: {
      name: claim.employer.name,
      ein: claim.employer.ein
    },
    employmentDates: {
      startDate: claim.employmentDates.startDate instanceof Date ? 
        claim.employmentDates.startDate.toISOString().split('T')[0] : claim.employmentDates.startDate,
      endDate: claim.employmentDates.endDate instanceof Date ? 
        claim.employmentDates.endDate.toISOString().split('T')[0] : claim.employmentDates.endDate
    },
    separationReason: claim.separationReason,
    separationDetails: claim.separationDetails || '',
    wageData: {
      lastQuarterEarnings: claim.wageData.lastQuarterEarnings,
      annualEarnings: claim.wageData.annualEarnings
    }
  };
}

// Retry function remains the same as before
async function sendClaimWithRetry(claim, retries = CAMEL_RETRY_COUNT) {
  try {
    return await sendClaimToCamel(claim);
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying sending claim ${claim.claimId} to Camel. Attempts remaining: ${retries - 1}`);
      const delay = Math.pow(2, CAMEL_RETRY_COUNT - retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendClaimWithRetry(claim, retries - 1);
    } else {
      console.error(`Failed to send claim ${claim.claimId} to Camel after ${CAMEL_RETRY_COUNT} attempts`);
      throw error;
    }
  }
}

module.exports = {
  sendClaimToCamel,
  sendClaimWithRetry
};
