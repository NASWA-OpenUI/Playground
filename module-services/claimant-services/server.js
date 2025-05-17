/**
 * Claimant Services Server
 * 
 * This server provides a GraphQL API for claimant services
 * including claim submission and status retrieval
 */

require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

// Import GraphQL schema and resolvers
const typeDefs = require('./src/schema');
const resolvers = require('./src/resolvers');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/claimant';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // Here you could add authentication context
    return { req };
  },
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    
    return {
      message: error.message,
      locations: error.locations,
      path: error.path
    };
  }
});

// Start Apollo Server and Express
async function startServer() {
  await server.start();
  
  // Apply Apollo middleware to Express
  server.applyMiddleware({ app, path: '/graphql' });
  
  // Start Express server
  app.listen(PORT, () => {
    console.log(`Claimant Services running at http://localhost:${PORT}`);
    console.log(`GraphQL endpoint available at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});