# Apache Camel Unified Gateway

This service combines both API Gateway and Integration Service functionality, replacing Traefik and providing a single entry point for all UI Modernization Demo services.

## Overview

The Unified Gateway handles:
- **API Gateway**: Routes all external traffic to appropriate services
- **Protocol Conversion**: GraphQL ↔ REST ↔ (future gRPC)
- **Data Transformation**: MongoDB schema ↔ PostgreSQL schema
- **Live Monitoring**: Real-time dashboard showing all integrations
- **Static Content**: Serves UI applications and demo pages

## Architecture

```
Internet → Camel Gateway → [Claimant Services | Claims Processing | Future Services]
            ↓
        Protocol & Data
        Transformation
            ↓
        Real-time Monitoring
```

## Key Features

### API Gateway Capabilities
- **Unified Entry Point**: Single port (80) for all services
- **Route Management**: Declarative routing via Camel routes
- **Static Content Serving**: Built-in web server for UIs
- **CORS Support**: Cross-origin request handling
- **Error Handling**: Comprehensive error responses

### Integration Service Capabilities
- **Multi-Protocol Support**: REST, GraphQL, with easy gRPC extension
- **Data Transformation**: Field mapping, format conversion, schema translation
- **Real-time Monitoring**: Live dashboard with auto-refresh
- **Health Checks**: Service health and route status monitoring
- **JMX Integration**: Production-ready metrics and management

## URL Structure

### Public URLs (External Access)
- `http://localhost/` - Main demo landing page
- `http://localhost/claimant/` - Claimant portal (React)
- `http://localhost/processor/` - Claims processing portal (Vue)
- `http://localhost/integration/api/v1/monitoring` - Live monitoring dashboard

### API Endpoints
- `http://localhost/graphql` - GraphQL API (proxied to Claimant Services)
- `http://localhost/api/claims` - REST API (proxied to Claims Processing)

### Integration Endpoints
- `POST /integration/api/v1/claims/submit` - Submit claim with conversion
- `PUT /integration/api/v1/claims/{id}/status` - Update status with propagation
- `GET /integration/api/v1/health` - Integration service health
- `GET /integration/api/v1/routes` - List all routes and their status

### Management Endpoints
- `http://localhost/management/health` - Spring Actuator health
- `http://localhost/management/camelroutes` - Detailed route information
- `http://localhost/management/metrics` - Application metrics

## Data Flow Examples

### 1. Claim Submission (GraphQL → REST)
```
Claimant UI → POST /integration/api/v1/claims/submit
            ↓
         GraphQL Data
            ↓
    Camel Transformation
            ↓
         REST Data
            ↓
    Claims Processing API
            ↓
        Response Conversion
            ↓
       GraphQL Response
```

### 2. Status Update (REST → GraphQL)
```
Claims UI → PUT /integration/api/v1/claims/{id}/status
           ↓
        REST Data
           ↓
   Camel Transformation
           ↓
     GraphQL Mutation
           ↓
   Claimant Services API
           ↓
    Status Updated
```

### 3. Direct API Access (Pass-through)
```
External Client → GET /api/claims
                ↓
            Camel Proxy
                ↓
        Claims Processing
                ↓
           Direct Response
```

## Configuration

### Service URLs (application.yml)
```yaml
services:
  claimant:
    url: http://claimant-services:4000
  claims-processing:
    url: http://claims-processing:8000
```

### Camel Configuration
```yaml
camel:
  springboot:
    name: UIModernizationGateway
    jmx-enabled: true
    endpoint-runtime-statistics-enabled: true
```

## Running the System

### Prerequisites
- Java 11+
- Maven 3.6+
- Docker & Docker Compose

### Quick Start
```bash
# Clone and navigate to project
cd playground

# Build and start all services
docker-compose up --build

# Access the demo
open http://localhost/
```

### Development Mode
```bash
# Start dependencies
docker-compose up mongodb postgres

# Run Camel Gateway locally
cd module-services/camel-gateway
./mvnw spring-boot:run

# Access local development
open http://localhost:8080/
```

## Demo Flow

### For Policy Stakeholders
1. **Start at Main Page** (`http://localhost/`)
   - Overview of modular architecture
   - Links to different service portals

2. **Show Claimant Experience** (`http://localhost/claimant/`)
   - React-based UI with GraphQL backend
   - MongoDB data storage

3. **Show Processing Experience** (`http://localhost/processor/`)
   - Vue.js-based UI with REST backend
   - PostgreSQL data storage

4. **Show Integration Monitoring** (`http://localhost/integration/api/v1/monitoring`)
   - Real-time view of protocol conversions
   - Live status of all integrations
   - Visual representation of data flow

### For Technical Stakeholders
1. **Route Information** (`http://localhost/integration/api/v1/routes`)
   - JSON view of all integration routes
   - Route types and statuses

2. **Health Monitoring** (`http://localhost/management/health`)
   - Service health checks
   - Dependency status

3. **Metrics Dashboard** (`http://localhost/management/metrics`)
   - Performance metrics
   - Request counts and timing

## Testing

### Automated Tests
```bash
# Run integration tests
./integration-test.sh

# Manual API testing
curl http://localhost/integration/api/v1/health
```

### Manual Testing
- Submit test claims through claimant portal
- Process claims through processing portal
- Watch protocol conversions in monitoring dashboard

## Extending the System

### Adding New Services
1. Create new route in `UnifiedGatewayRoutes.java`
2. Add service URL to `application.yml`
3. Create transformation processors if needed

### Adding New Protocols
1. Add Camel component dependency (e.g., `camel-grpc-starter`)
2. Create new transformation routes
3. Update monitoring dashboard

### Adding Authentication
1. Add Spring Security dependency
2. Configure security in Camel routes
3. Update CORS configuration

## Troubleshooting

### Common Issues
1. **Port Conflicts**: Ensure port 80 is available
2. **Service Discovery**: Check Docker network configuration
3. **CORS Errors**: Verify CORS settings in route configuration

### Debug Information
```bash
# View Camel route details
curl http://localhost/management/camelroutes | jq

# Check service connectivity
docker-compose ps
docker-compose logs camel-gateway

# Monitor real-time logs
docker-compose logs -f camel-gateway
```

### Useful Debug Endpoints
- `/integration/api/v1/health` - Integration health
- `/management/health` - Application health
- `/management/camelroutes` - Route details
- `/integration/api/v1/monitoring` - Live monitoring

## Production Considerations

### Security
- Add authentication/authorization
- Configure HTTPS/TLS
- Implement rate limiting
- Add request logging

### Performance
- Enable connection pooling
- Configure caching
- Add load balancing
- Monitor JVM metrics

### Monitoring
- Set up external monitoring (Prometheus/Grafana)
- Configure alerting
- Enable distributed tracing
- Log aggregation

## Benefits for Demo

### For Policy Audience
- **Single Entry Point**: Easy to understand architecture
- **Visual Monitoring**: See integration happening in real-time
- **Technology Diversity**: Different services use different tech stacks
- **Open Source**: Apache Foundation credibility

### For Technical Audience
- **Production Ready**: Real integration patterns and monitoring
- **Extensible**: Easy to add new services and protocols
- **Standards Based**: Uses established integration patterns
- **Maintainable**: Clear separation of concerns

This unified approach significantly simplifies the demo while providing a more realistic representation of how a production integration gateway would work.