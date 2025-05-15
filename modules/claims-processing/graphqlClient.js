// modules/claims-processing/graphqlClient.js
const { GraphQLClient, gql } = require('graphql-request');

const client = new GraphQLClient(`${process.env.KONG_URL}/employer/graphql`);

const WAGE_QUERY = gql`
  query GetWages($ssnLast4: String!, $employerName: String!) {
    wages(ssnLast4: $ssnLast4, employerName: $employerName) {
      employerName
      employeeSsn
      quarters {
        quarter
        wages
      }
      totalWages
    }
  }
`;

module.exports = {
  getWages: async (ssnLast4, employerName) => {
    try {
      const data = await client.request(WAGE_QUERY, {
        ssnLast4,
        employerName
      });
      
      // Transform GraphQL response to match existing format
      return {
        employerName: data.wages.employerName,
        employeeSSN: data.wages.employeeSsn,
        quarters: data.wages.quarters,
        totalWages: data.wages.totalWages
      };
    } catch (error) {
      console.error('GraphQL error:', error);
      throw error;
    }
  }
};
