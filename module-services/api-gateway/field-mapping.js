/**
 * Field mapping configuration for protocol conversion
 * Maps GraphQL field names to REST field names
 */

const fieldMapping = {
  // User/Claimant mappings
  userId: "claimant_id",
  fullName: "claimant_name",
  ssn: "social_security_number",
  contactInfo: "contact_details",
  
  // Claim mappings
  claimId: "claim_reference_id",
  employmentHistory: "employment_records",
  status: "claim_status",
  separationReason: "separation_reason",
  submissionDate: "filing_date",
  
  // Employment record mappings
  employerId: "employer_id",
  employerName: "employer_name",
  startDate: "start_date",
  endDate: "end_date",
  wages: "wage_data",
  position: "position_title"
};

// Reverse mapping (REST to GraphQL)
const reverseFieldMapping = Object.entries(fieldMapping).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

// Status value mapping
const statusMapping = {
  Submitted: "received",
  InProcess: "processing",
  WaitingEmployerInfo: "waiting_for_employer",
  Approved: "approved",
  Denied: "denied"
};

// Reverse status mapping
const reverseStatusMapping = Object.entries(statusMapping).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

/**
 * Convert field names from GraphQL format to REST format
 * @param {Object} data - Data in GraphQL format
 * @returns {Object} - Data in REST format
 */
function convertToRestFormat(data) {
  if (!data || typeof data !== "object") return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => convertToRestFormat(item));
  }
  
  // Handle objects
  const result = {};
  
  for (const [key, value] of Object.entries(data)) {
    const mappedKey = fieldMapping[key] || key;
    
    // Handle nested objects and arrays
    if (typeof value === "object" && value !== null) {
      result[mappedKey] = convertToRestFormat(value);
    } else if (key === "status" && statusMapping[value]) {
      // Handle status value mapping
      result[mappedKey] = statusMapping[value];
    } else {
      result[mappedKey] = value;
    }
  }
  
  return result;
}

/**
 * Convert field names from REST format to GraphQL format
 * @param {Object} data - Data in REST format
 * @returns {Object} - Data in GraphQL format
 */
function convertToGraphQLFormat(data) {
  if (!data || typeof data !== "object") return data;
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => convertToGraphQLFormat(item));
  }
  
  // Handle objects
  const result = {};
  
  for (const [key, value] of Object.entries(data)) {
    const mappedKey = reverseFieldMapping[key] || key;
    
    // Handle nested objects and arrays
    if (typeof value === "object" && value !== null) {
      result[mappedKey] = convertToGraphQLFormat(value);
    } else if (key === "claim_status" && reverseStatusMapping[value]) {
      // Handle status value mapping
      result[mappedKey] = reverseStatusMapping[value];
    } else {
      result[mappedKey] = value;
    }
  }
  
  return result;
}

module.exports = {
  fieldMapping,
  reverseFieldMapping,
  statusMapping,
  reverseStatusMapping,
  convertToRestFormat,
  convertToGraphQLFormat
};