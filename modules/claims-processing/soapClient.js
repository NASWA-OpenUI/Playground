// modules/claims-processing/soapClient.js
const soap = require('soap');

let rulesClient = null;

const initializeSoapClient = async () => {
  try {
    const wsdlUrl = `${process.env.KONG_URL}/rules/soap?wsdl`;
    rulesClient = await soap.createClientAsync(wsdlUrl);
    console.log('SOAP client initialized');
  } catch (error) {
    console.error('Failed to initialize SOAP client:', error);
  }
};

const calculateBenefit = async (totalWages) => {
  if (!rulesClient) {
    await initializeSoapClient();
  }
  
  if (!rulesClient) {
    throw new Error('SOAP client not available');
  }
  
  try {
    const [result] = await rulesClient.CalculateBenefitAsync({
      totalWages: totalWages
    });
    
    return {
      weeklyBenefitAmount: result.weeklyBenefitAmount,
      maxBenefitAmount: result.maxBenefitAmount,
      taxRateUsed: result.taxRateUsed,
      formula: result.formula,
      rulesVersion: result.rulesVersion
    };
  } catch (error) {
    console.error('SOAP call error:', error);
    throw error;
  }
};

module.exports = { calculateBenefit, initializeSoapClient };
