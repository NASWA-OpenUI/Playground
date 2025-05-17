import { gql } from '@apollo/client';

// Submit Claim Mutation
export const SUBMIT_CLAIM = gql`
  mutation SubmitClaim($input: ClaimInput!) {
    submitClaim(input: $input) {
      claim {
        id
        claimId
        status
        submissionDate
      }
      success
      message
    }
  }
`;

// Get Claim By ID Query
export const GET_CLAIM = gql`
  query GetClaimById($id: ID!) {
    getClaimById(id: $id) {
      id
      claimId
      userId
      employmentHistory {
        employerId
        employerName
        startDate
        endDate
        wages
        position
      }
      separationReason
      status
      submissionDate
    }
  }
`;

// Get Claims By User Query
export const GET_CLAIMS_BY_USER = gql`
  query GetClaimsByUser($userId: ID!) {
    getClaimsByUser(userId: $userId) {
      id
      claimId
      status
      submissionDate
      separationReason
    }
  }
`;

// Get User Profile Query
export const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID!) {
    getUserProfile(id: $id) {
      id
      userId
      fullName
      contactInfo {
        email
        phone
        address {
          street
          city
          state
          zip
        }
      }
    }
  }
`;

// Update Claim Status Mutation
export const UPDATE_CLAIM_STATUS = gql`
  mutation UpdateClaimStatus($id: ID!, $input: StatusUpdateInput!) {
    updateClaimStatus(id: $id, input: $input) {
      claim {
        id
        claimId
        status
      }
      success
      message
    }
  }
`;