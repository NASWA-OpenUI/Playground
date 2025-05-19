# Claimant Services - UI Modernization Demo

## Overview

This is the Claimant Services module of the UI Modernization Demo, showcasing how unemployment insurance systems can be modernized using a microservices architecture. This service handles claim submissions from claimants and exposes a GraphQL API for integration with other services.

## Technology Stack

- **Backend**: Node.js + Express
- **API**: GraphQL (with GraphQL Playground)
- **Database**: MongoDB
- **Frontend**: Vanilla JavaScript with modern CSS
- **Authentication**: Simple token-based (for demo purposes)

## Features

- **Claim Submission**: Single-page form for unemployment claim submission
- **Real-time Status**: Live claim status tracking
- **GraphQL API**: Modern API for service integration
- **Responsive Design**: Mobile-friendly interface
- **Data Validation**: Client and server-side validation

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or remote)
- Git

### Local Development

1. **Clone and navigate to the directory**:
   ```bash
   cd claimant-services
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   
   # Or start your local MongoDB service
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - UI: http://localhost:3000
   - GraphQL Playground: http://localhost:3000/graphql
   - Health Check: http://localhost:3000/health

### Docker Deployment

```bash
# Build the image
docker build -t claimant-services .

# Run the container
docker run -d -p 3000:3000 --name claimant-services \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/claimant_services \
  claimant-services
```

## API Documentation

### GraphQL Schema

The service exposes a GraphQL API with the following main operations:

#### Mutations

- `createClaim(input: ClaimInput!)`: Submit a new unemployment claim
- `updateClaimStatus(claimId: String!, status: String!)`: Update claim status
- `updateBenefitAmounts(claimId: String!, weeklyAmount: Float!, maximumAmount: Float!)`: Update benefit calculations

#### Queries

- `getClaim(claimId: String!)`: Retrieve a specific claim
- `getClaimsByUser(userId: String!)`: Get all claims for a user
- `getClaimStatus(claimId: String!)`: Get current status of a claim

### Example GraphQL Operations

**Create a claim**:
```graphql
mutation {
  createClaim(input: {
    firstName: "John"
    lastName: "Doe"
    ssn: "123-45-6789"
    dateOfBirth: "1990-01-01"
    email: "john.doe@email.com"
    phone: "555-123-4567"
    address: {
      street: "123 Main St"
      city: "Denver"
      state: "CO"
      zipCode: "80202"
    }
    employer: {
      name: "Acme Corp"
      ein: "12-3456789"
      address: {
        street: "456 Business Ave"
        city: "Denver"
        state: "CO"
        zipCode: "80203"
      }
    }
    employmentDates: {
      startDate: "2020-01-01"
      endDate: "2023-12-31"
    }
    separationReason: "laid_off"
    wageData: {
      lastQuarterEarnings: 15000.00
      annualEarnings: 60000.00
    }
  }) {
    claimId
    status
    statusDisplayName
  }
}
```

**Get claim details**:
```graphql
query {
  getClaim(claimId: "CLM-1234567890-ABC12") {
    claimId
    firstName
    lastName
    status
    statusDisplayName
    weeklyBenefitAmount
    maximumBenefitAmount
    statusHistory {
      status
      timestamp
      notes
    }
  }
}
```

## Data Model

### Core Data Elements

The system handles these key data categories:

- **Identity Information**: SSN, name, DOB, contact details
- **Employment Information**: Employer details, employment dates, separation reason
- **Claim Details**: Claim ID, status, wage data
- **System Information**: Timestamps, audit trail

### Status Flow

Claims progress through these statuses:
1. `submitted` - Initial submission
2. `processing` - Under review
3. `waitingForEmployer` - Awaiting employer verification
4. `approved` - Claim approved
5. `denied` - Claim denied

## Integration with Other Services

This service is designed to integrate with:

- **Claims Processing Service**: Receives claims via GraphQL
- **API Gateway (Camel)**: Handles protocol conversion
- **Benefits Administration**: Receives benefit calculations

### Field Mapping

The service uses camelCase naming conventions (e.g., `userId`, `claimId`) which are translated by the API Gateway for integration with other services that may use different naming conventions.

## Development

### Project Structure

```
claimant-services/
├── models/
│   └── Claim.js              # MongoDB schema
├── graphql/
│   ├── schema.js             # GraphQL schema definition
│   └── resolvers.js          # GraphQL resolvers
├── public/
│   ├── index.html            # Main UI
│   ├── styles.css            # Styling
│   └── app.js                # Frontend JavaScript
├── server.js                 # Express server
├── package.json
├── Dockerfile
└── README.md
```

### Adding New Features

1. **Database Changes**: Update `models/Claim.js`
2. **API Changes**: Update `graphql/schema.js` and `graphql/resolvers.js`
3. **UI Changes**: Update files in `public/`

### Environment Variables

- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `NODE_ENV`: Environment (development/production)
- `GRAPHQL_INTROSPECTION`: Enable GraphQL introspection
- `GRAPHQL_PLAYGROUND`: Enable GraphQL Playground

## Monitoring and Health Checks

- **Health Endpoint**: `GET /health`
- **Service Status**: Includes database connectivity
- **GraphQL Playground**: Available in development mode
- **Docker Health Check**: Built-in container health monitoring

## Security Considerations

This is a demonstration system with simplified security:

- No authentication/authorization (demo purposes)
- Basic input validation
- CORS enabled for all origins
- No rate limiting implemented

For production use, implement:
- JWT-based authentication
- Role-based authorization
- Input sanitization
- Rate limiting
- HTTPS enforcement

## Contributing

This is a demonstration project. For modifications:

1. Follow the existing code style
2. Update tests if adding new features
3. Update this README for significant changes
4. Ensure compatibility with the overall demo architecture

## License

MIT License - This is a demonstration project for educational purposes.