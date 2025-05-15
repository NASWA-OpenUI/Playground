const express = require('express');
const soap = require('soap');
const fs = require('fs');
const path = require('path');
const { soapService, loadRules } = require('./soapService');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load WSDL
const wsdlPath = path.join(__dirname, 'wsdl', 'rules.wsdl');
const wsdl = fs.readFileSync(wsdlPath, 'utf8');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Business Rules Engine SOAP Service is running' });
});

// Create SOAP server
app.listen(PORT, () => {
  console.log(`Business Rules Engine running on port ${PORT}`);
  
  // Create SOAP service
  soap.listen(app, '/soap', soapService, wsdl, () => {
    console.log('SOAP service initialized at /soap');
  });
});

// Watch for rule changes (for demo purposes)
if (process.env.NODE_ENV !== 'production') {
  fs.watchFile(path.join(__dirname, 'rules.json'), () => {
    console.log('Rules file changed, reloading...');
    loadRules();
  });
}
