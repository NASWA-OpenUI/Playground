// business-rules-engine/src/rules/tax-rule.js

// In-memory storage for tax rate
let taxRate = 0.22;

/**
 * Tax Rule Service - manages tax rates and benefit calculations
 */
const taxRuleService = {
  /**
   * Calculate benefit based on weekly wage and current tax rate
   * @param {number} weeklyWage - The weekly wage
   * @param {number} rate - Optional tax rate, defaults to the current rate
   * @returns {object} Benefit calculation result
   */
  calculateBenefit: (weeklyWage, rate = null) => {
    const appliedRate = rate !== null ? rate : taxRate;
    
    // Business rule formula: 50% of weekly wage after tax
    const weeklyBenefit = Math.round(weeklyWage * 0.5 * (1 - appliedRate));
    
    // Maximum benefit is 26 weeks
    const maxBenefit = weeklyBenefit * 26;
    
    return {
      weeklyBenefit,
      maxBenefit,
      taxRate: appliedRate
    };
  },

  /**
   * Update the system tax rate
   * @param {number} newRate - The new tax rate (0-1)
   * @returns {object} Update result
   */
  updateTaxRate: (newRate) => {
    // Validate tax rate
    if (isNaN(newRate) || newRate < 0 || newRate > 1) {
      return {
        success: false,
        message: 'Tax rate must be a number between 0 and 1'
      };
    }
    
    // Update the tax rate
    taxRate = newRate;
    
    return {
      success: true,
      message: `Tax rate updated to ${newRate}`
    };
  },

  /**
   * Get the current tax rate
   * @returns {number} Current tax rate
   */
  getCurrentTaxRate: () => {
    return taxRate;
  }
};

module.exports = taxRuleService;