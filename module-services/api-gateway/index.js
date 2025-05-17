/**
 * API Gateway Entry Point
 * Sets up an Express server and uses the protocol converter middleware
 */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const { processGraphQLRequest } = require('./middleware/protocol-converter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev')); // Logging
app.use(cors()); // CORS
app.use(bodyParser.json()); // Parse JSON body

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Protocol conversion endpoint
app.post('/convert/graphql-to-rest', async (req, res) => {
  try {
    const result = await processGraphQLRequest(req);
    res.json(result);
  } catch (error) {
    console.error('Error in conversion endpoint:', error);
    res.status(500).json({
      errors: [
        {
          message: error.message || 'Internal server error',
          locations: [],
          path: []
        }
      ]
    });
  }
});

// Catch-all for other routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Protocol converter running at http://localhost:${PORT}`);
  console.log(`GraphQL to REST conversion endpoint: http://localhost:${PORT}/convert/graphql-to-rest`);
});
