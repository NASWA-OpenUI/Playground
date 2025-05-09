const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const xml2js = require('xml2js');

const app = express();
const port = 3005;

app.use(cors());
// Use text parser for XML content
app.use(bodyParser.text({ type: 'text/xml' }));
app.use(bodyParser.json());

// In-memory store for tax rates
const taxRates = {
  'EMP001': 0.027,  // 2.7% - good employer rate
  'EMP002': 0.045   // 4.5% - higher rate employer
};

// SOAP endpoint for tax rate lookup
app.post('/soap', async (req, res) => {
  try {
    // If this is a SOAP request
    if (req.is('text/xml')) {
      console.log('Received SOAP request');
      
      // Parse the SOAP envelope
      const parsedXml = await parseXml(req.body);
      
      // Extract the request data from the SOAP Body
      const soapBody = parsedXml['soap:Envelope']['soap:Body'][0];
      
      // Determine what operation is being requested
      if (soapBody.GetEmployerTaxRate) {
        const employerId = soapBody.GetEmployerTaxRate[0].EmployerId[0];
        return handleGetTaxRate(employerId, res);
      } else {
        // Unknown operation
        sendSoapFault(res, 'Client', 'Unknown operation requested');
      }
    } else {
      // Handle non-SOAP requests
      res.status(415).json({
        success: false,
        message: 'Unsupported Media Type. This endpoint expects SOAP requests.'
      });
    }
  } catch (error) {
    console.error('Error processing SOAP request:', error);
    sendSoapFault(res, 'Server', 'Error processing request');
  }
});

// Handle GET request for tax rate (for testing without SOAP)
app.get('/api/tax/rate/:employerId', (req, res) => {
  const { employerId } = req.params;
  const taxRate = taxRates[employerId];
  
  if (taxRate === undefined) {
    return res.status(404).json({
      success: false,
      message: 'Tax rate not found for employer'
    });
  }
  
  res.json({
    success: true,
    employerId,
    taxRate
  });
});

// Helper function to parse XML to JS object
function parseXml(xml) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

// Handle tax rate lookup
function handleGetTaxRate(employerId, res) {
  console.log(`Looking up tax rate for employer ${employerId}`);
  const taxRate = taxRates[employerId];
  
  if (taxRate === undefined) {
    return sendSoapFault(res, 'Client', `Tax rate not found for employer ${employerId}`);
  }
  
  // Build SOAP response
  const soapResponse = `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <GetEmployerTaxRateResponse>
          <EmployerId>${employerId}</EmployerId>
          <TaxRate>${taxRate}</TaxRate>
          <EffectiveDate>2023-01-01</EffectiveDate>
          <ExpirationDate>2023-12-31</ExpirationDate>
        </GetEmployerTaxRateResponse>
      </soap:Body>
    </soap:Envelope>
  `;
  
  res.set('Content-Type', 'text/xml');
  res.send(soapResponse);
}

// Send SOAP fault response
function sendSoapFault(res, faultCode, faultString) {
  const soapFault = `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <soap:Fault>
          <faultcode>soap:${faultCode}</faultcode>
          <faultstring>${faultString}</faultstring>
        </soap:Fault>
      </soap:Body>
    </soap:Envelope>
  `;
  
  res.status(500).set('Content-Type', 'text/xml');
  res.send(soapFault);
}

app.listen(port, () => {
  console.log(`Tax Administration Service listening at http://localhost:${port}`);
});