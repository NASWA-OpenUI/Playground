package com.playground.camel.transformers;

import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.parsers.DocumentBuilder;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import java.io.StringWriter;
import java.io.StringReader;
import java.util.Iterator;
import java.util.Map;
import org.xml.sax.InputSource;

@Component
public class DataTransformer {

    private static final Logger logger = LoggerFactory.getLogger(DataTransformer.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Transforms JSON data to XML format
     * 
     * @param jsonData The JSON data to transform
     * @return The data in XML format
     */
    public String jsonToXml(String jsonData) throws Exception {
        logger.info("Transforming JSON to XML: {}", jsonData);
        
        // Parse JSON
        JsonNode rootNode = objectMapper.readTree(jsonData);
        
        // Create XML document
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.newDocument();
        
        // Create root element
        Element rootElement = doc.createElement("root");
        doc.appendChild(rootElement);
        
        // Convert JSON to XML elements
        processJsonNode(rootNode, rootElement, doc);
        
        // Convert to string
        TransformerFactory transformerFactory = TransformerFactory.newInstance();
        javax.xml.transform.Transformer transformer = transformerFactory.newTransformer();
        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(doc), new StreamResult(writer));
        
        String xmlOutput = writer.toString();
        logger.info("Transformed XML: {}", xmlOutput);
        
        return xmlOutput;
    }
    
    /**
     * Transforms XML data to JSON format
     * 
     * @param xmlData The XML data to transform
     * @return The data in JSON format
     */
    public String xmlToJson(String xmlData) throws Exception {
        logger.info("Transforming XML to JSON: {}", xmlData);
        
        // Parse XML
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        DocumentBuilder builder = factory.newDocumentBuilder();
        InputSource is = new InputSource(new StringReader(xmlData));
        Document doc = builder.parse(is);
        
        // Start with the root element
        Element rootElement = doc.getDocumentElement();
        
        // Create JSON object
        ObjectNode rootNode = objectMapper.createObjectNode();
        
        // Convert XML to JSON
        processXmlElement(rootElement, rootNode);
        
        // Convert to string
        String jsonOutput = objectMapper.writeValueAsString(rootNode);
        logger.info("Transformed JSON: {}", jsonOutput);
        
        return jsonOutput;
    }
    
    /**
     * Recursive helper method to process XML elements and convert to JSON
     */
    private void processXmlElement(Element element, ObjectNode jsonNode) {
        // Process attributes
        if (element.hasAttributes()) {
            for (int i = 0; i < element.getAttributes().getLength(); i++) {
                Node attr = element.getAttributes().item(i);
                jsonNode.put("@" + attr.getNodeName(), attr.getNodeValue());
            }
        }
        
        // Process child elements
        NodeList children = element.getChildNodes();
        
        // Check if this element has only text content
        if (children.getLength() == 1 && children.item(0).getNodeType() == Node.TEXT_NODE) {
            jsonNode.put("#text", element.getTextContent().trim());
            return;
        }
        
        // Process children elements
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            
            if (child.getNodeType() == Node.ELEMENT_NODE) {
                Element childElement = (Element) child;
                String tagName = childElement.getTagName();
                
                // Check if we have multiple elements with the same name (should be an array)
                boolean isArray = false;
                for (int j = i + 1; j < children.getLength(); j++) {
                    if (children.item(j).getNodeType() == Node.ELEMENT_NODE &&
                            ((Element)children.item(j)).getTagName().equals(tagName)) {
                        isArray = true;
                        break;
                    }
                }
                
                if (isArray) {
                    // Create or get array node
                    ArrayNode arrayNode;
                    if (jsonNode.has(tagName)) {
                        arrayNode = (ArrayNode) jsonNode.get(tagName);
                    } else {
                        arrayNode = jsonNode.putArray(tagName);
                    }
                    
                    // Add this element to the array
                    ObjectNode childNode = arrayNode.addObject();
                    processXmlElement(childElement, childNode);
                } else {
                    // Regular element
                    ObjectNode childNode = jsonNode.putObject(tagName);
                    processXmlElement(childElement, childNode);
                }
            }
        }
    }
    
    /**
     * Recursive helper method to process JSON nodes and convert to XML
     */
    private void processJsonNode(JsonNode jsonNode, Element xmlElement, Document doc) {
        if (jsonNode.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = jsonNode.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                String fieldName = field.getKey();
                JsonNode fieldValue = field.getValue();
                
                if (fieldValue.isValueNode()) {
                    // Simple value
                    Element childElement = doc.createElement(fieldName);
                    childElement.setTextContent(fieldValue.asText());
                    xmlElement.appendChild(childElement);
                } else {
                    // Complex object or array
                    Element childElement = doc.createElement(fieldName);
                    xmlElement.appendChild(childElement);
                    processJsonNode(fieldValue, childElement, doc);
                }
            }
        } else if (jsonNode.isArray()) {
            // Handle array elements
            for (int i = 0; i < jsonNode.size(); i++) {
                Element itemElement = doc.createElement("item");
                xmlElement.appendChild(itemElement);
                processJsonNode(jsonNode.get(i), itemElement, doc);
            }
        }
    }

    /**
     * Extracts claim data from a GraphQL mutation response
     * 
     * @param graphQLResponse The response from the GraphQL API
     * @return The extracted claim data as a JSON string
     */
    public String extractClaimFromGraphQL(String graphQLResponse) throws Exception {
        JsonNode responseNode = objectMapper.readTree(graphQLResponse);
        
        // Navigate to the actual claim data in the GraphQL response
        if (responseNode.has("data") && responseNode.get("data").has("createClaim")) {
            return objectMapper.writeValueAsString(responseNode.get("data").get("createClaim"));
        }
        
        throw new IllegalArgumentException("Invalid GraphQL response format - cannot extract claim data");
    }

    /**
     * Transforms claim data from claimant-services format to claims-processing format
     * 
     * @param claimJson The claim data in JSON format
     * @return The transformed claim data as a JSON string
     */
    public String transformClaimToProcessingFormat(String claimJson) throws Exception {
        JsonNode claimNode = objectMapper.readTree(claimJson);
        ObjectNode transformedClaim = objectMapper.createObjectNode();
        
        // Map fields from claimant-services format to claims-processing format
        // This is where we handle the field name differences between services
        
        // Claim reference ID
        if (claimNode.has("claimId")) {
            transformedClaim.put("claim_reference_id", claimNode.get("claimId").asText());
        }
        
        // Claimant information
        if (claimNode.has("firstName") && claimNode.has("lastName")) {
            ObjectNode transformedClaimant = objectMapper.createObjectNode();
            
            transformedClaimant.put("claimant_id", claimNode.has("userId") ? claimNode.get("userId").asText() : "");
            transformedClaimant.put("first_name", claimNode.get("firstName").asText());
            transformedClaimant.put("last_name", claimNode.get("lastName").asText());
            if (claimNode.has("ssn")) transformedClaimant.put("ssn", claimNode.get("ssn").asText());
            if (claimNode.has("dateOfBirth")) transformedClaimant.put("birth_date", claimNode.get("dateOfBirth").asText());
            
            // Contact information
            ObjectNode transformedContact = objectMapper.createObjectNode();
            if (claimNode.has("email")) transformedContact.put("email_address", claimNode.get("email").asText());
            if (claimNode.has("phone")) transformedContact.put("phone_number", claimNode.get("phone").asText());
            
            // Address
            if (claimNode.has("address")) {
                JsonNode address = claimNode.get("address");
                ObjectNode transformedAddress = objectMapper.createObjectNode();
                
                if (address.has("street")) transformedAddress.put("street", address.get("street").asText());
                if (address.has("city")) transformedAddress.put("city", address.get("city").asText());
                if (address.has("state")) transformedAddress.put("state", address.get("state").asText());
                if (address.has("zipCode")) transformedAddress.put("postal_code", address.get("zipCode").asText());
                
                transformedContact.set("mailing_address", transformedAddress);
            }
            
            transformedClaimant.set("contact_info", transformedContact);
            transformedClaim.set("claimant", transformedClaimant);
        }
        
        // Employment information
        if (claimNode.has("employer")) {
            JsonNode employment = claimNode.get("employer");
            ObjectNode transformedEmployment = objectMapper.createObjectNode();
            
            // Employer
            ObjectNode transformedEmployer = objectMapper.createObjectNode();
            if (employment.has("name")) transformedEmployer.put("business_name", employment.get("name").asText());
            if (employment.has("ein")) transformedEmployer.put("employer_id", employment.get("ein").asText());
            transformedEmployment.set("employer", transformedEmployer);
            
            // Employment dates
            if (claimNode.has("employmentDates")) {
                JsonNode dates = claimNode.get("employmentDates");
                ObjectNode transformedDates = objectMapper.createObjectNode();
                
                if (dates.has("startDate")) transformedDates.put("start", dates.get("startDate").asText());
                if (dates.has("endDate")) transformedDates.put("end", dates.get("endDate").asText());
                
                transformedEmployment.set("employment_period", transformedDates);
            }
            
            // Separation details
            if (claimNode.has("separationReason")) {
                transformedEmployment.put("separation_reason_code", claimNode.get("separationReason").asText());
            }
            if (claimNode.has("separationDetails")) {
                transformedEmployment.put("separation_explanation", claimNode.get("separationDetails").asText());
            }
            
            transformedClaim.set("employment_record", transformedEmployment);
        }
        
        // Wage information
        if (claimNode.has("wageData")) {
            JsonNode wages = claimNode.get("wageData");
            ObjectNode transformedWages = objectMapper.createObjectNode();
            
            if (wages.has("lastQuarterEarnings")) 
                transformedWages.put("base_period_q4", wages.get("lastQuarterEarnings").asDouble());
            if (wages.has("annualEarnings")) 
                transformedWages.put("total_earnings", wages.get("annualEarnings").asDouble());
            
            transformedClaim.set("wage_history", transformedWages);
        }
        
        // Status information
        if (claimNode.has("status")) {
            ObjectNode transformedStatus = objectMapper.createObjectNode();
            transformedStatus.put("status_code", claimNode.get("status").asText());
            
            if (claimNode.has("submissionTimestamp")) 
                transformedStatus.put("submission_date", claimNode.get("submissionTimestamp").asText());
            
            transformedClaim.set("claim_status", transformedStatus);
        }
        
        // Add processing metadata
        ObjectNode metadata = objectMapper.createObjectNode();
        metadata.put("source_system", "claimant-services");
        metadata.put("received_timestamp", System.currentTimeMillis());
        transformedClaim.set("metadata", metadata);
        
        return objectMapper.writeValueAsString(transformedClaim);
    }
}
