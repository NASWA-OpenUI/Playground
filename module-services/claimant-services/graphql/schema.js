const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Address {
    street: String!
    city: String!
    state: String!
    zipCode: String!
  }
  
  type Employer {
    name: String!
    ein: String!
    address: Address!
  }
  
  type EmploymentDates {
    startDate: String!
    endDate: String!
  }
  
  type WageData {
    lastQuarterEarnings: Float!
    annualEarnings: Float!
  }
  
  type StatusHistoryEntry {
    status: String!
    timestamp: String!
    notes: String
  }
  
  type Claim {
    id: ID!
    claimId: String!
    userId: String!
    firstName: String!
    lastName: String!
    ssn: String!
    dateOfBirth: String!
    email: String!
    phone: String!
    address: Address!
    employer: Employer!
    employmentDates: EmploymentDates!
    separationReason: String!
    separationDetails: String
    wageData: WageData!
    status: String!
    statusDisplayName: String!
    weeklyBenefitAmount: Float
    maximumBenefitAmount: Float
    submissionTimestamp: String!
    lastUpdated: String!
    statusHistory: [StatusHistoryEntry!]!
  }
  
  input AddressInput {
    street: String!
    city: String!
    state: String!
    zipCode: String!
  }
  
  input EmployerInput {
    name: String!
    ein: String!
    address: AddressInput!
  }
  
  input EmploymentDatesInput {
    startDate: String!
    endDate: String!
  }
  
  input WageDataInput {
    lastQuarterEarnings: Float!
    annualEarnings: Float!
  }
  
  input ClaimInput {
    firstName: String!
    lastName: String!
    ssn: String!
    dateOfBirth: String!
    email: String!
    phone: String!
    address: AddressInput!
    employer: EmployerInput!
    employmentDates: EmploymentDatesInput!
    separationReason: String!
    separationDetails: String
    wageData: WageDataInput!
  }
  
  type Query {
    # Get claim by ID
    getClaim(claimId: String!): Claim
    
    # Get claims by user ID
    getClaimsByUser(userId: String!): [Claim!]!
    
    # Get claim status
    getClaimStatus(claimId: String!): String
    
    # Health check
    health: String!
  }
  
  type Mutation {
    # Create a new claim
    createClaim(input: ClaimInput!): Claim!
    
    # Update claim status (for integration with claims processing)
    updateClaimStatus(claimId: String!, status: String!, notes: String): Claim!
    
    # Update benefit amounts (called when benefits are calculated)
    updateBenefitAmounts(claimId: String!, weeklyAmount: Float!, maximumAmount: Float!): Claim!
  }
  
  type Subscription {
    # Subscribe to claim status changes
    claimStatusChanged(claimId: String!): Claim!
    
    # Subscribe to benefit calculations
    benefitCalculated(claimId: String!): Claim!
  }
`);

module.exports = schema;