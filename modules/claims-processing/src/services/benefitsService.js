// Modules/claims-processing/src/services/benefitsService.js
const axios = require('axios');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';
const BENEFITS_SERVICE_URL = `${API_GATEWAY_URL}/api/benefits`;

// Calculate benefits for a claim
exports.calculateBenefits = async (benefitRequest) => {
  try {
    // For demo purposes, we'll mock the benefit calculation
    // In a real implementation, you would call the benefits service
    // const response = await axios.post(`${BENEFITS_SERVICE_URL}/calculate`, benefitRequest);
    // return response.data;
    
    console.log('Benefits calculation request:', benefitRequest);
    
    // Simulate a basic benefit calculation
    let totalWages = 0;
    let totalWeeks = 0;
    
    for (const employment of benefitRequest.employmentHistory) {
      // Calculate total wages based on employment details
      const startDate = new Date(employment.startDate);
      const endDate = new Date(employment.endDate);
      
      // Calculate weeks worked (simplified)
      const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
      const weeksWorked = Math.round((endDate - startDate) / millisecondsPerWeek);
      
      // Calculate wages based on pay frequency
      let weeklyWage = 0;
      
      switch (employment.payFrequency) {
        case 'Hourly':
          weeklyWage = employment.wageRate * (employment.hoursPerWeek || 40);
          break;
        case 'Weekly':
          weeklyWage = employment.wageRate;
          break;
        case 'Biweekly':
          weeklyWage = employment.wageRate / 2;
          break;
        case 'Monthly':
          weeklyWage = (employment.wageRate * 12) / 52;
          break;
        case 'Annually':
          weeklyWage = employment.wageRate / 52;
          break;
        default:
          weeklyWage = 0;
      }
      
      totalWages += weeklyWage * weeksWorked;
      totalWeeks += weeksWorked;
    }
    
    // Average weekly wage
    const averageWeeklyWage = totalWeeks > 0 ? totalWages / totalWeeks : 0;
    
    // Weekly benefit amount (typically 50% of average weekly wage, capped)
    const weeklyBenefitAmount = Math.min(averageWeeklyWage * 0.5, 500);
    
    // Maximum benefit amount (typically 26 weeks of benefits)
    const maximumBenefitAmount = weeklyBenefitAmount * 26;
    
    // Tax withholding (mock rate of 10%)
    const taxWithholdingRate = 0.1;
    const netWeeklyBenefitAmount = weeklyBenefitAmount * (1 - taxWithholdingRate);
    
    // Benefit year
    const now = new Date();
    const benefitYearStart = now.toISOString();
    const benefitYearEnd = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
    
    return {
      claimId: benefitRequest.claimId,
      weeklyBenefitAmount,
      maximumBenefitAmount,
      benefitYear: {
        startDate: benefitYearStart,
        endDate: benefitYearEnd
      },
      taxWithholdingRate,
      netWeeklyBenefitAmount
    };
  } catch (error) {
    console.error('Error calculating benefits:', error);
    throw new Error('Failed to calculate benefits');
  }
};
