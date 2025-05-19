# Apache Camel Integration Hub

## Overview

This is the core integration platform that demonstrates protocol and data format conversion between disparate services. The hub currently provides:

- **Health Monitoring Dashboard** at http://localhost:8081
- **REST API endpoints** for service integration at http://localhost:8080
- **Real-time service status tracking** with 30-second health checks
- **Protocol translation capabilities** (JSON ↔ XML, GraphQL ↔ REST)

## Current Status

The Camel Gateway is running with placeholder services. As you connect additional services, they will automatically appear on the health dashboard.

### Configured Service Placeholders:
- **Submit Service** (Node.js + GraphQL/JSON) - *Not configured yet*
- **Receive Service** (Java/Spring + REST/XML) - *Not configured yet*

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Java 17 or higher (for local development)

### Running the Service

1. **Using Docker Compose:**
   ```bash
   cd playground
   docker-compose up camel-gateway
   ```

2. **Access the Dashboard:**
   - Open http://localhost:8081 in your browser
   - You should see the health dashboard with placeholder services

3. **API Endpoints:**
   - Health Status: `GET http://localhost:8080/api/health/services`
   - Submit Processing: `POST http://localhost:8080/api/submit`

## Architecture

### Components

#### Health Monitor
- Tracks service status every 30 seconds
- Provides real-time dashboard updates
- Automatically discovers new services

#### Data Transformer
- Converts between JSON and XML formats
- Maps different field naming conventions:
  - `firstName` ↔ `first_name`
  - `companyName` ↔ `company_name`
  - `hireDate` ↔ `hire_date` (with date format conversion)

#### Integration Routes
- **Submission Route**: Handles incoming GraphQL/JSON requests
- **Transformation Route**: Converts data formats and field names
- **Health Check Route**: Monitors connected services
- **Response Route**: Converts responses back to appropriate format

### Protocol Support

Currently configured to handle:
- **GraphQL** (incoming from submit service)
- **REST** (outgoing to receive service)
- **JSON** ↔ **XML** conversion
- Custom field mapping and date format conversion

## Development

### Project Structure
```
module-services/camel-gateway/
├── src/main/java/com/playground/camel/
│   ├── CamelGatewayApp.java
│   ├── routes/IntegrationRoutes.java
│   ├── transformers/DataTransformer.java
│   ├── monitoring/HealthMonitor.java
│   └── controller/DashboardController.java
├── src/main/resources/
│   ├── application.properties
│   └── templates/dashboard.html
├── pom.xml
└── Dockerfile
```

### Next Steps

1. **Connect Submit Service**: When the Node.js GraphQL service is ready, it will automatically register and appear on the dashboard
2. **Connect Receive Service**: When the Java REST service is ready, integration routes will activate
3. **Test Protocol Translation**: Submit data through one protocol and see it converted for the other service

## Monitoring

The dashboard shows:
- **Camel Gateway Status**: Current operational state
- **Active Connections**: Number of services currently responding to health checks
- **Registered Services**: Total services configured in the system
- **Last Health Check**: Timestamp of most recent monitoring cycle

Each service card displays:
- Service name and current status
- Technology stack and communication protocol
- Endpoint URL
- Last successful health check
- Current status message