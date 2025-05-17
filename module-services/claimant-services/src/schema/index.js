/**
 * GraphQL Schema for Claimant Services
 */

const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    getClaimById(id: ID!): Claim
    getClaimsByUser(userId: ID!): [Claim]
    getUserProfile(id: ID!): User
  }

  type Mutation {
    submitClaim(input: ClaimInput!): ClaimResult
    updateClaimStatus(id: ID!, input: StatusUpdateInput!): ClaimResult
  }

  type User {
    id: ID!
    userId: String!
    fullName: String!
    ssn: String!
    contactInfo: ContactInfo!
    createdAt: String!
  }

  type ContactInfo {
    email: String!
    phone: String!
    address: Address!
  }

  type Address {
    street: String!
    city: String!
    state: String!
    zip: String!
  }

  type Claim {
    id: ID!
    claimId: String!
    userId: String!
    user: User
    employmentHistory: [EmploymentRecord!]!
    separationReason: String!
    status: String!
    submissionDate: String!
  }

  type EmploymentRecord {
    employerId: String!
    employerName: String!
    startDate: String!
    endDate: String!
    wages: Float!
    position: String!
  }

  type ClaimResult {
    claim: Claim
    success: Boolean!
    message: String
  }

  input ClaimInput {
    userId: String!
    employmentHistory: [EmploymentRecordInput!]!
    separationReason: String!
  }

  input EmploymentRecordInput {
    employerId: String!
    employerName: String!
    startDate: String!
    endDate: String!
    wages: Float!
    position: String!
  }

  input ContactInfoInput {
    email: String!
    phone: String!
    address: AddressInput!
  }

  input AddressInput {
    street: String!
    city: String!
    state: String!
    zip: String!
  }

  input StatusUpdateInput {
    status: String!
    reason: String
  }
`;

module.exports = typeDefs;