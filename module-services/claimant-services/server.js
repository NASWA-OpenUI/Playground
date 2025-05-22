const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const schema = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');
const camelService = require('./services/camel');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/claimant_services';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('📊 MongoDB connected successfully');
  
  // Initialize gateway connection after DB is ready
  setTimeout(() => {
    camelService.initialize();
  }, 1000);
})
.catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// GraphQL endpoint
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: resolvers,
  graphiql: true, // Enable GraphQL playground in development
}));

// Serve the main UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const gatewayStatus = camelService.isRegistered ? 'connected' : 'disconnected';
  
  res.json({
    status: 'UP',
    service: 'claimant-services',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    gateway: gatewayStatus,
    version: process.env.SERVICE_VERSION || '1.0.0'
  });
});

// Gateway status endpoint
app.get('/gateway-status', (req, res) => {
  res.json({
    gatewayUrl: process.env.CAMEL_GRAPHQL_URL || 'http://camel-gateway:8080',
    isRegistered: camelService.isRegistered,
    serviceName: process.env.SERVICE_NAME || 'claimant-services',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Claimant Services running on port ${PORT}`);
  console.log(`📊 GraphQL playground: http://localhost:${PORT}/graphql`);
  console.log(`🌐 UI available at: http://localhost:${PORT}`);
  console.log(`💓 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Gateway status: http://localhost:${PORT}/gateway-status`);
});