const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

const rulesDir = path.join(__dirname, '../rules');

// Ensure rules directory exists
fs.ensureDirSync(rulesDir);

// Create default benefit calculation rule if it doesn't exist
const defaultRulePath = path.join(rulesDir, 'benefit-calculation.json');
if (!fs.existsSync(defaultRulePath)) {
  const defaultRule = {
    "name": "Benefit Calculation",
    "description": "Calculate weekly benefit amount based on earnings",
    "rules": [
      {
        "name": "Basic Benefit Calculation",
        "conditions": {
          "all": [
            {
              "fact": "quarterlyWages",
              "operator": "greaterThan",
              "value": 0
            }
          ]
        },
        "event": {
          "type": "calculateBenefit",
          "params": {
            "formula": "quarterlyWages * benefitRate",
            "maxWeeklyBenefit": 450,
            "minWeeklyBenefit": 50,
            "benefitRate": 0.04
          }
        }
      }
    ]
  };
  
  fs.writeJsonSync(defaultRulePath, defaultRule, { spaces: 2 });
  console.log('Created default benefit calculation rule');
}

// Get a specific rule by name
app.get('/api/rules/:ruleName', async (req, res) => {
  try {
    const { ruleName } = req.params;
    const rulePath = path.join(rulesDir, `${ruleName}.json`);
    
    if (!await fs.pathExists(rulePath)) {
      return res.status(404).json({
        success: false,
        message: `Rule '${ruleName}' not found`
      });
    }
    
    const ruleData = await fs.readJson(rulePath);
    res.json(ruleData);
  } catch (error) {
    console.error('Error reading rule:', error);
    res.status(500).json({
      success: false,
      message: 'Error reading rule'
    });
  }
});

// List all available rules
app.get('/api/rules', async (req, res) => {
  try {
    const files = await fs.readdir(rulesDir);
    const ruleFiles = files.filter(file => file.endsWith('.json'));
    
    const rules = await Promise.all(
      ruleFiles.map(async (file) => {
        const ruleData = await fs.readJson(path.join(rulesDir, file));
        return {
          name: file.replace('.json', ''),
          description: ruleData.description || 'No description provided'
        };
      })
    );
    
    res.json({
      success: true,
      rules
    });
  } catch (error) {
    console.error('Error listing rules:', error);
    res.status(500).json({
      success: false,
      message: 'Error listing rules'
    });
  }
});

// Update a rule
app.put('/api/rules/:ruleName', async (req, res) => {
  try {
    const { ruleName } = req.params;
    const rulePath = path.join(rulesDir, `${ruleName}.json`);
    
    if (!await fs.pathExists(rulePath)) {
      return res.status(404).json({
        success: false,
        message: `Rule '${ruleName}' not found`
      });
    }
    
    await fs.writeJson(rulePath, req.body, { spaces: 2 });
    
    res.json({
      success: true,
      message: `Rule '${ruleName}' updated successfully`
    });
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating rule'
    });
  }
});

app.listen(port, () => {
  console.log(`Rules Engine listening at http://localhost:${port}`);
});