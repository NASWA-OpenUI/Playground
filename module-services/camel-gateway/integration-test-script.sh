#!/bin/bash

# Integration Test Script for Unified Camel Gateway
# Tests both API Gateway and Integration Service functionality

BASE_URL="http://localhost"
INTEGRATION_API="$BASE_URL/integration/api/v1"

echo "🚀 Testing Unified Apache Camel Gateway..."
echo "=============================================="

# Test 1: Main Demo Page
echo "1. Testing main demo page..."
curl -s -w "Status: %{http_code}\n" "$BASE_URL/" > /dev/null
echo ""

# Test 2: Claimant Portal
echo "2. Testing claimant portal..."
curl -s -w "Status: %{http_code}\n" "$BASE_URL/claimant/" > /dev/null
echo ""

# Test 3: Claims Processing Portal  
echo "3. Testing claims processing portal..."
curl -s -w "Status: %{http_code}\n" "$BASE_URL/processor/" > /dev/null
echo ""

# Test 4: Integration Service Health
echo "4. Testing integration service health..."
curl -s "$INTEGRATION_API/health" | jq .
echo ""

# Test 5: Route Information
echo "5. Testing route information..."
curl -s "$INTEGRATION_API/routes" | jq .
echo ""

# Test 6: Monitoring Dashboard
echo "6. Testing monitoring dashboard..."
curl -s -w "Status: %{http_code}\n" "$INTEGRATION_API/monitoring" > /dev/null
echo ""

# Test 7: GraphQL Proxy (basic connectivity test)
echo "7. Testing GraphQL proxy..."
curl -s -X POST "$BASE_URL/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}' \
  -w "Status: %{http_code}\n" > /dev/null
echo ""

# Test 8: Claims REST API Proxy
echo "8. Testing Claims REST API proxy..."
curl -s "$BASE_URL/api/claims" \
  -H "Accept: application/json" \
  -w "Status: %{http_code}\n" > /dev/null
echo ""

# Test 9: Submit Claim with Protocol Conversion
echo "9. Testing claim submission with protocol conversion..."
cat << EOF > test_claim.json
{
  "userId": "507f1f77bcf86cd799439011",
  "personalInfo": {
    "firstName": "Jane",
    "lastName": "Smith",
    "ssn": "987-65-4321",
    "dateOfBirth": "1985-06-15",
    "email": "jane.smith@example.com",
    "phone": "555-9876"
  },
  "employmentHistory": [
    {
      "employerName": "TechCorp Industries",
      "employerEIN": "98-7654321",
      "startDate": "2021-03-01",
      "endDate": "2024-05-15",
      "reasonForSeparation": "Company Restructuring",
      "weeklyWage": 1250
    }
  ],
  "status": "submitted"
}
EOF

curl -s -X POST "$INTEGRATION_API/claims/submit" \
  -H "Content-Type: application/json" \
  -d @test_claim.json | jq .
echo ""

# Test 10: Status Update with Protocol Conversion
echo "10. Testing status update with protocol conversion..."
curl -s -X PUT "$INTEGRATION_API/claims/C-2024-789012/status" \
  -H "Content-Type: application/json" \
  -d '{"claim_status": "processing"}' | jq .
echo ""

# Test 11: Management Endpoints
echo "11. Testing Spring Actuator management endpoints..."
echo "   Health: $(curl -s $BASE_URL/management/health | jq -r .status)"
echo "   Camel Routes: $(curl -s $BASE_URL/management/camelroutes | jq '. | length') routes"
echo ""

# Test 12: Load Test (optional)
echo "12. Running basic load test..."
echo "   Making 10 concurrent requests to main page..."
for i in {1..10}; do
  curl -s "$BASE_URL/" > /dev/null &
done
wait
echo "   Load test completed ✅"
echo ""

# Clean up
rm -f test_claim.json

echo "✅ All tests completed!"
echo ""
echo "🔍 Key URLs for manual testing:"
echo "   Main Demo: $BASE_URL/"
echo "   Claimant Portal: $BASE_URL/claimant/"
echo "   Claims Portal: $BASE_URL/processor/"
echo "   Live Monitoring: $INTEGRATION_API/monitoring"
echo "   Route Details: $INTEGRATION_API/routes"
echo "   Health Check: $INTEGRATION_API/health"
echo "   Management: $BASE_URL/management/health"
echo ""
echo "📊 To view real-time integration monitoring:"
echo "   Open: $INTEGRATION_API/monitoring"
echo "   (Auto-refreshes every 5 seconds)"