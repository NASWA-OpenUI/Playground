// api-gateway/src/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createProxyMiddleware } = require('http-proxy-middleware');
const soap = require('soap');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { GraphQLClient } = require('graphql-request');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text({ type: 'text/xml' }));

// Event bus for publish/subscribe pattern
const eventSubscribers = {
  'claim.submitted': [],
  'employer.verified': [],
  'benefit.calculated': [],
  'payment.processed': []
};

// Event bus methods
const eventBus = {
  publish: (eventName, data) => {
    console.log(`[EVENT BUS] Publishing event: ${eventName}`);
    if (!eventSubscribers[eventName]) {
      eventSubscribers[eventName] = [];
    }
    
    eventSubscribers[eventName].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event subscriber for ${eventName}:`, error);
      }
    });
    
    return { success: true, subscribers: eventSubscribers[eventName].length };
  },
  
  subscribe: (eventName, callback) => {
    console.log(`[EVENT BUS] New subscriber for: ${eventName}`);
    if (!eventSubscribers[eventName]) {
      eventSubscribers[eventName] = [];
    }
    
    eventSubscribers[eventName].push(callback);
    return { success: true, event: eventName };
  }
};

// API Gateway routes
app.get('/', (req, res) => {
  res.json({
    message: 'UI Modernization API Gateway',
    status: 'operational',
    services: [
      { name: 'Claimant Services', protocol: 'REST', status: 'online' },
      { name: 'Claims Processing', protocol: 'REST', status: 'online' },
      { name: 'Employer Services', protocol: 'GraphQL', status: 'online' },
      { name: 'Benefits Administration', protocol: 'gRPC', status: 'online' },
      { name: 'Business Rules Engine', protocol: 'SOAP', status: 'online' }
    ]
  });
});

// REST to REST proxy for Claims Processing
app.use('/api/claims', createProxyMiddleware({
  target: 'http://localhost:3002',
  pathRewrite: { '^/api/claims': '/api' },
  changeOrigin: true
}));

// Event bus API
app.post('/api/events/publish', (req, res) => {
  const { eventName, data } = req.body;
  const result = eventBus.publish(eventName, data);
  res.json(result);
});

app.post('/api/events/subscribe', (req, res) => {
  // This is a simplified implementation that wouldn't work in production
  // Real implementation would use WebSockets or Server-Sent Events
  const { eventName, callbackUrl } = req.body;
  
  const callback = async (data) => {
    try {
      await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error(`Error sending event to ${callbackUrl}:`, error);
    }
  };
  
  const result = eventBus.subscribe(eventName, callback);
  res.json(result);
});

// REST to GraphQL adapter for Employer Services
app.post('/api/employer/verify', async (req, res) => {
  try {
    console.log('[API GATEWAY] REST to GraphQL - Employer verification');
    const { claimId, claimantName } = req.body;
    
    const graphqlClient = new GraphQLClient('http://localhost:3003/graphql');
    const query = `
      mutation RequestVerification($claimId: ID!, $claimantName: String!) {
        requestVerification(claimId: $claimId, claimantName: $claimantName) {
          success
          message
        }
      }
    `;
    
    const variables = { claimId, claimantName };
    const data = await graphqlClient.request(query, variables);
    
    res.json(data);
  } catch (error) {
    console.error('Error in GraphQL request:', error);
    res.status(500).json({ error: 'Failed to communicate with Employer Services' });
  }
});

// REST to SOAP adapter for Business Rules Engine
app.post('/api/rules/calculate-benefit', async (req, res) => {
  try {
    console.log('[API GATEWAY] REST to SOAP - Calculate benefit');
    const { claimId, weeklyWage, taxRate } = req.body;
    
    const soapUrl = 'http://localhost:3001/soap/rules?wsdl';
    const client = await soap.createClientAsync(soapUrl);
    
    const result = await client.calculateBenefitAsync({
      claimId,
      weeklyWage,
      taxRate
    });
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error in SOAP request:', error);
    res.status(500).json({ error: 'Failed to communicate with Business Rules Engine' });
  }
});

// REST to gRPC adapter for Benefits Administration
app.post('/api/benefits/process-payment', async (req, res) => {
  try {
    console.log('[API GATEWAY] REST to gRPC - Process payment');
    const { claimId, amount } = req.body;
    
    // Load protobuf definition
    const packageDefinition = protoLoader.loadSync(
      '../benefits-administration/src/Protos/benefits.proto',
      {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
      }
    );
    
    const benefitsProto = grpc.loadPackageDefinition(packageDefinition).benefits;
    
    // Create gRPC client
    const client = new benefitsProto.BenefitsService(
      'localhost:3004',
      grpc.credentials.createInsecure()
    );
    
    // Make gRPC call
    client.processPayment({ claimId, amount }, (error, response) => {
      if (error) {
        console.error('Error in gRPC request:', error);
        res.status(500).json({ error: 'Failed to process payment' });
        return;
      }
      
      res.json(response);
    });
  } catch (error) {
    console.error('Error setting up gRPC request:', error);
    res.status(500).json({ error: 'Failed to communicate with Benefits Administration' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});