# Kong/scripts/setup.sh
#!/bin/bash

# Wait for Kong to be available
echo "Waiting for Kong Admin API to be available..."
while ! curl -s http://kong:8001 > /dev/null; do
  sleep 1
done

echo "Kong Admin API is available. Setting up routes and services..."

# Register services in Kong
echo "Registering Claims Processing Service..."
curl -s -X POST http://kong:8001/services \
  --data name=claims-processing \
  --data url=http://claims-processing:3002

echo "Registering Employer Services..."
curl -s -X POST http://kong:8001/services \
  --data name=employer-services \
  --data url=http://employer-services:3003

echo "Registering Benefits Administration..."
curl -s -X POST http://kong:8001/services \
  --data name=benefits-admin \
  --data url=http://benefits-admin:3004

echo "Registering Business Rules Engine..."
curl -s -X POST http://kong:8001/services \
  --data name=business-rules \
  --data url=http://business-rules:3001

# Register routes
echo "Creating route for Claims Processing API..."
curl -s -X POST http://kong:8001/services/claims-processing/routes \
  --data "paths[]=/api/claims" \
  --data name=claims-route

echo "Creating route for Employer Services API..."
curl -s -X POST http://kong:8001/services/employer-services/routes \
  --data "paths[]=/api/employers" \
  --data name=employers-route \
  --data "methods[]=GET" \
  --data "methods[]=POST" \
  --data "methods[]=PUT" \
  --data "methods[]=PATCH" \
  --data "methods[]=DELETE"

echo "Creating route for Employer Services GraphQL..."
curl -s -X POST http://kong:8001/services/employer-services/routes \
  --data "paths[]=/graphql" \
  --data name=employer-graphql-route

echo "Creating route for Benefits Administration API..."
curl -s -X POST http://kong:8001/services/benefits-admin/routes \
  --data "paths[]=/api/benefits" \
  --data name=benefits-route

echo "Creating route for Business Rules Engine..."
curl -s -X POST http://kong:8001/services/business-rules/routes \
  --data "paths[]=/api/rules" \
  --data name=rules-route

# Enable CORS plugin for all routes
echo "Enabling CORS for all services..."
curl -s -X POST http://kong:8001/plugins \
  --data name=cors \
  --data config.origins=* \
  --data config.methods=GET,POST,PUT,DELETE,PATCH,OPTIONS \
  --data config.headers=Content-Type,Authorization \
  --data config.exposed_headers=Content-Length \
  --data config.credentials=true \
  --data config.max_age=3600

# Verify routes were created
echo "Verifying configuration..."
curl -s http://kong:8001/routes | jq -r '.data[] | .name + ": " + (.paths | join(", "))'

echo "Kong setup completed successfully!"
