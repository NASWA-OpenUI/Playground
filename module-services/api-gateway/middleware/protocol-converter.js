/**
 * Protocol converter middleware
 * Converts GraphQL mutations to REST API calls
 */

const { parse } = require('graphql');
const gql = require('graphql-tag');
const axios = require('axios');
const { convertToRestFormat, convertToGraphQLFormat } = require('./field-mapping');

// Claims processing service URL
const CLAIMS_SERVICE_URL = process.env.CLAIMS_SERVICE_URL || 'http://claims-processing:8000';

/**
 * Extract operation name and variables from GraphQL request
 * @param {Object} req - Express request object
 * @returns {Object} - Operation name and variables
 */
function extractGraphQLData(req) {
  try {
    const { query, variables } = req.body;
    
    if (!query) {
      throw new Error('No GraphQL query provided');
    }
    
    // Parse the GraphQL query
    const parsedQuery = parse(query);
    
    // Get the operation (mutation or query)
    const operation = parsedQuery.definitions[0];
    
    // Get operation name
    const operationName = operation.selectionSet.selections[0].name.value;
    
    return {
      operationName,
      variables
    };
  } catch (error) {
    console.error('Error parsing GraphQL query:', error);
    throw new Error('Invalid GraphQL query');
  }
}

/**
 * Convert GraphQL mutation to REST API call
 * @param {string} operationName - GraphQL operation name
 * @param {Object} variables - GraphQL variables
 * @returns {Object} - REST API endpoint and data
 */
function convertToREST(operationName, variables) {
  // Map GraphQL operations to REST endpoints
  const operationMapping = {
    submitClaim: {
      method: 'POST',
      endpoint: '/api/claims',
      dataKey: 'input'
    },
    getClaimById: {
      method: 'GET',
      endpoint: `/api/claims/${variables.id}`,
      dataKey: null
    },
    getClaimsByUser: {
      method: 'GET',
      endpoint: `/api/claims?claimant_id=${variables.userId}`,
      dataKey: null
    },
    updateClaimStatus: {
      method: 'POST',
      endpoint: `/api/claims/${variables.id}/status`,
      dataKey: 'input'
    }
  };
  
  const operation = operationMapping[operationName];
  
  if (!operation) {
    throw new Error(`Unsupported operation: ${operationName}`);
  }
  
  // Convert data from GraphQL format to REST format
  const restData = operation.dataKey ? 
    convertToRestFormat(variables[operation.dataKey]) : 
    null;
  
  return {
    method: operation.method,
    endpoint: operation.endpoint,
    data: restData
  };
}

/**
 * Make REST API call to Claims Processing service
 * @param {Object} restOperation - REST API operation
 * @returns {Promise<Object>} - REST API response
 */
async function makeRESTCall(restOperation) {
  const { method, endpoint, data } = restOperation;
  const url = `${CLAIMS_SERVICE_URL}${endpoint}`;
  
  console.log(`Making ${method} request to ${url}`);
  if (data) {
    console.log('Request data:', JSON.stringify(data, null, 2));
  }
  
  try {
    let response;
    
    switch (method) {
      case 'GET':
        response = await axios.get(url);
        break;
      case 'POST':
        response = await axios.post(url, data);
        break;
      case 'PUT':
        response = await axios.put(url, data);
        break;
      case 'DELETE':
        response = await axios.delete(url);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error making REST call:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Convert REST response to GraphQL response
 * @param {string} operationName - GraphQL operation name
 * @param {Object} restResponse - REST API response
 * @returns {Object} - GraphQL response
 */
function convertToGraphQL(operationName, restResponse) {
  // Convert data from REST format to GraphQL format
  const graphQLData = convertToGraphQLFormat(restResponse);
  
  // Map REST responses to GraphQL response structure
  const responseMapping = {
    submitClaim: {
      fieldName: 'submitClaim',
      wrapper: 'ClaimResult'
    },
    getClaimById: {
      fieldName: 'getClaimById',
      wrapper: 'Claim'
    },
    getClaimsByUser: {
      fieldName: 'getClaimsByUser',
      wrapper: 'Claim'
    },
    updateClaimStatus: {
      fieldName: 'updateClaimStatus',
      wrapper: 'ClaimResult'
    }
  };
  
  const response = responseMapping[operationName];
  
  if (!response) {
    throw new Error(`Unsupported operation for response: ${operationName}`);
  }
  
  // Format response according to GraphQL expectations
  return {
    data: {
      [response.fieldName]: graphQLData
    }
  };
}

/**
 * Process GraphQL request and return REST response
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} - GraphQL response
 */
async function processGraphQLRequest(req) {
  try {
    // Extract operation name and variables from GraphQL request
    const { operationName, variables } = extractGraphQLData(req);
    
    // Convert GraphQL to REST
    const restOperation = convertToREST(operationName, variables);
    
    // Make REST API call
    const restResponse = await makeRESTCall(restOperation);
    
    // Convert REST response to GraphQL response
    const graphQLResponse = convertToGraphQL(operationName, restResponse);
    
    return graphQLResponse;
  } catch (error) {
    console.error('Error processing GraphQL request:', error);
    return {
      errors: [
        {
          message: error.message,
          locations: [],
          path: []
        }
      ],
      data: null
    };
  }
}

module.exports = {
  processGraphQLRequest
};