const express = require('express');
const { Engine } = require('json-rules-engine');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Load rules from file
let rulesConfig = {};
const loadRules = () => {
  try {
    const rulesPath = path.join(__dirname, 'rules.json');
    const rulesData = fs.readFileSync(rulesPath, 'utf8');
    rulesConfig = JSON.parse(rulesData);
    console.log('Rules loaded successfully');
  } catch (error) {
    console.error('Error loading rules:', error);
    // Default rules if file not found
    rulesConfig = {
      rules: {
        benefitCalculation: {
          name: "Weekly Benefit Amount Calculation",
          conditions: {
            all: [
              {
                fact: "totalWages",
                operator: "greaterThan",
                value: 0
              }
            ]
          },
          event: {
            type: "calculateBenefit",
            params: {
              formula: "totalWages / 52 * 0.5",
              maxWeeklyBenefit: 450,
              minWeeklyBenefit: 50
            }
          }
        },
        taxRate: {
          name: "UI Tax Rate",
          value: 0.5,
          description: "Multiplier for benefit calculation (changeable for demo)"
        }
      }
    };
  }
};

// Load rules on startup
loadRules();

// Watch for rule changes (for demo purposes)
if (process.env.NODE_ENV !== 'production') {
  fs.watchFile(path.join(__dirname, 'rules.json'), () => {
    console.log('Rules file changed, reloading...');
    loadRules();
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Business Rules Engine is running' });
});

// Calculate benefit amount
app.post('/api/calculate-benefit', async (req, res) => {
  try {
    const { totalWages } = req.body;
    
    // Get current tax rate from rules
    const taxRate = rulesConfig.rules.taxRate.value;
    
    // Create a new engine instance
    const engine = new Engine();
    
    // Create the rule for benefit calculation
    const rule = {
      conditions: {
        all: [{
          fact: 'totalWages',
          operator: 'greaterThan',
          value: 0
        }]
      },
      event: {
        type: 'benefitCalculated'
      },
      onSuccess: async (event, almanac) => {
        const wages = await almanac.factValue('totalWages');
        const weeklyBenefit = wages / 52 * taxRate;
        
        // Apply min/max limits
        const minBenefit = rulesConfig.rules.benefitCalculation.event.params.minWeeklyBenefit;
        const maxBenefit = rulesConfig.rules.benefitCalculation.event.params.maxWeeklyBenefit;
        
        event.params = {
          weeklyBenefitAmount: Math.min(Math.max(weeklyBenefit, minBenefit), maxBenefit),
          maxBenefitAmount: Math.min(Math.max(weeklyBenefit, minBenefit), maxBenefit) * 26,
          taxRateUsed: taxRate,
          formula: `totalWages / 52 * ${taxRate}`
        };
      }
    };
    
    engine.addRule(rule);
    
    // Run the engine
    const facts = { totalWages };
    const results = await engine.run(facts);
    
    // Find our calculation result
    const benefitEvent = results.events.find(e => e.type === 'benefitCalculated');
    
    if (benefitEvent) {
      res.json({
        weeklyBenefitAmount: benefitEvent.params.weeklyBenefitAmount,
        maxBenefitAmount: benefitEvent.params.maxBenefitAmount,
        taxRateUsed: benefitEvent.params.taxRateUsed,
        formula: benefitEvent.params.formula,
        rulesVersion: new Date().toISOString()
      });
    } else {
      throw new Error('Benefit calculation failed');
    }
    
  } catch (error) {
    console.error('Error calculating benefit:', error);
    res.status(500).json({ error: 'Failed to calculate benefit' });
  }
});

// Get current rules (for demo/admin purposes)
app.get('/api/rules', (req, res) => {
  res.json(rulesConfig);
});

// Update tax rate (for demo purposes)
app.post('/api/update-tax-rate', (req, res) => {
  try {
    const { newRate } = req.body;
    
    if (newRate < 0 || newRate > 1) {
      return res.status(400).json({ error: 'Tax rate must be between 0 and 1' });
    }
    
    // Update in memory
    rulesConfig.rules.taxRate.value = newRate;
    
    // Save to file
    const rulesPath = path.join(__dirname, 'rules.json');
    fs.writeFileSync(rulesPath, JSON.stringify(rulesConfig, null, 2));
    
    res.json({
      message: 'Tax rate updated successfully',
      newRate,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating tax rate:', error);
    res.status(500).json({ error: 'Failed to update tax rate' });
  }
});

app.listen(PORT, () => {
  console.log(`Business Rules Engine running on port ${PORT}`);
});