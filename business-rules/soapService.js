const fs = require('fs');
const path = require('path');
const { Engine } = require('json-rules-engine');

// Load rules configuration
let rulesConfig = {};
const loadRules = () => {
  try {
    const rulesPath = path.join(__dirname, 'rules.json');
    const rulesData = fs.readFileSync(rulesPath, 'utf8');
    rulesConfig = JSON.parse(rulesData);
    console.log('Rules loaded successfully');
  } catch (error) {
    console.error('Error loading rules:', error);
    rulesConfig = {
      rules: {
        benefitCalculation: {
          name: "Weekly Benefit Amount Calculation",
          conditions: {
            all: [{
              fact: "totalWages",
              operator: "greaterThan",
              value: 0
            }]
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
          description: "Multiplier for benefit calculation"
        }
      }
    };
  }
};

loadRules();

// SOAP service implementation
const soapService = {
  BusinessRulesService: {
    BusinessRulesPort: {
      CalculateBenefit: async (args) => {
        try {
          const totalWages = parseFloat(args.totalWages);
          const taxRate = rulesConfig.rules.taxRate.value;
          
          const engine = new Engine();
          
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
          const facts = { totalWages };
          const results = await engine.run(facts);
          
          const benefitEvent = results.events.find(e => e.type === 'benefitCalculated');
          
          return {
            weeklyBenefitAmount: benefitEvent.params.weeklyBenefitAmount,
            maxBenefitAmount: benefitEvent.params.maxBenefitAmount,
            taxRateUsed: benefitEvent.params.taxRateUsed,
            formula: benefitEvent.params.formula,
            rulesVersion: new Date().toISOString()
          };
        } catch (error) {
          console.error('Error calculating benefit:', error);
          throw error;
        }
      },
      
      GetRules: () => {
        return {
          rules: JSON.stringify(rulesConfig, null, 2)
        };
      },
      
      UpdateTaxRate: (args) => {
        try {
          const newRate = parseFloat(args.newRate);
          
          if (newRate < 0 || newRate > 1) {
            return {
              success: false,
              message: 'Tax rate must be between 0 and 1',
              newRate: rulesConfig.rules.taxRate.value,
              timestamp: new Date().toISOString()
            };
          }
          
          rulesConfig.rules.taxRate.value = newRate;
          
          const rulesPath = path.join(__dirname, 'rules.json');
          fs.writeFileSync(rulesPath, JSON.stringify(rulesConfig, null, 2));
          
          return {
            success: true,
            message: 'Tax rate updated successfully',
            newRate: newRate,
            timestamp: new Date().toISOString()
          };
        } catch (error) {
          console.error('Error updating tax rate:', error);
          throw error;
        }
      }
    }
  }
};

module.exports = { soapService, loadRules };
