// claims-processing/src/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const claimsRoutes = require('./routes/claims-routes');
const employerRoutes = require('./routes/employer-routes');
const benefitsRoutes = require('./routes/benefits-routes');
const eventBusService = require('./services/event-bus-service');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    service: 'Claims Processing Service',
    status: 'operational',
    protocol: 'REST/JSON'
  });
});

// API routes
app.use('/api/claims', claimsRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/benefits', benefitsRoutes);

// Start the server
app.listen(PORT, async () => {
  console.log(`Claims Processing Service running on http://localhost:${PORT}`);
  
  // Subscribe to events from the event bus
  try {
    await eventBusService.subscribeToEvents();
    console.log('Successfully subscribed to Event Bus');
  } catch (error) {
    console.error('Failed to subscribe to Event Bus:', error);
  }
});