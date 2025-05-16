// business-rules-engine/src/index.js
const express = require('express');
const soap = require('soap');
const bodyParser = require('body-parser');
const cors = require('cors');
const taxRuleService = require('./rules/tax-rule');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/xml' }));

// Simple health check endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Business Rules Engine',
    status: 'operational',
    protocol: 'SOAP/XML'
  });
});

// SOAP service
const xml = require('fs').readFileSync('./src/rules/rules-service.wsdl', 'utf8');

// Initialize SOAP service with business rules
const serviceObject = {
  RulesService: {
    RulesServiceSoap: {
      // Calculate benefit amount based on wage and tax rate
      calculateBenefit: function(args) {
        console.log('[RULES ENGINE] Calculating benefit with args:', args);
        
        // Extract parameters
        const weeklyWage = parseFloat(args.weeklyWage);
        const taxRate = parseFloat(args.taxRate);
        
        // Apply business rule from tax-rule service
        const result = taxRuleService.calculateBenefit(weeklyWage, taxRate);
        
        // Return SOAP format response
        return {
          weeklyBenefit: result.weeklyBenefit,
          maxBenefit: result.maxBenefit,
          taxRate: taxRate
        };
      },
      
      // Determine eligibility based on work history
      determineEligibility: function(args) {
        console.log('[RULES ENGINE] Determining eligibility with args:', args);
        
        // Extract parameters
        const weeksWorked = parseInt(args.weeksWorked);
        const totalEarnings = parseFloat(args.totalEarnings);
        
        // Apply eligibility rules
        const isEligible = weeksWorked >= 20 && totalEarnings >= 2400;
        
        // Return SOAP format response
        return {
          eligible: isEligible,
          reason: isEligible ? 'Meets requirements' : 'Insufficient work history'
        };
      },
      
      // Update tax rate
      updateTaxRate: function(args) {
        console.log('[RULES ENGINE] Updating tax rate with args:', args);
        
        // Extract parameters
        const newRate = parseFloat(args.newRate);
        
        // Update the tax rate in the service
        const result = taxRuleService.updateTaxRate(newRate);
        
        // Return SOAP format response
        return {
          success: result.success,
          message: result.message,
          currentRate: taxRuleService.getCurrentTaxRate()
        };
      },
      
      // Get current tax rate
      getCurrentTaxRate: function() {
        console.log('[RULES ENGINE] Getting current tax rate');
        
        // Get current tax rate from service
        const taxRate = taxRuleService.getCurrentTaxRate();
        
        // Return SOAP format response
        return {
          taxRate: taxRate
        };
      }
    }
  }
};

// Create SOAP server
const soapServer = soap.listen(app, '/soap/rules', serviceObject, xml);

// Log SOAP requests
soapServer.log = function(type, data) {
  console.log(`[SOAP ${type}] ${data}`);
};

// Start server
app.listen(PORT, () => {
  console.log(`Business Rules Engine running on http://localhost:${PORT}`);
  console.log(`SOAP WSDL available at http://localhost:${PORT}/soap/rules?wsdl`);
});