package com.playground.camel.transformers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import java.io.StringWriter;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component("dataTransformer")
public class DataTransformer {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String jsonToXml(String jsonInput) throws Exception {
        // Parse incoming JSON (GraphQL format)
        JsonNode jsonNode = objectMapper.readTree(jsonInput);
        
        // Create XML document
        DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
        DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
        Document doc = dBuilder.newDocument();

        // Root element
        Element rootElement = doc.createElement("employeeSubmission");
        doc.appendChild(rootElement);

        // Transform field names and formats
        // firstName -> first_name
        if (jsonNode.has("firstName")) {
            Element firstName = doc.createElement("first_name");
            firstName.appendChild(doc.createTextNode(jsonNode.get("firstName").asText()));
            rootElement.appendChild(firstName);
        }

        // lastName -> last_name
        if (jsonNode.has("lastName")) {
            Element lastName = doc.createElement("last_name");
            lastName.appendChild(doc.createTextNode(jsonNode.get("lastName").asText()));
            rootElement.appendChild(lastName);
        }

        // companyName -> company_name
        if (jsonNode.has("companyName")) {
            Element companyName = doc.createElement("company_name");
            companyName.appendChild(doc.createTextNode(jsonNode.get("companyName").asText()));
            rootElement.appendChild(companyName);
        }

        // hireDate -> hire_date (with format conversion)
        if (jsonNode.has("hireDate")) {
            Element hireDate = doc.createElement("hire_date");
            String hireDateValue = jsonNode.get("hireDate").asText();
            // Convert ISO format to MM/dd/yyyy for XML
            String formattedDate = convertDateFormat(hireDateValue);
            hireDate.appendChild(doc.createTextNode(formattedDate));
            rootElement.appendChild(hireDate);
        }

        // separationDate -> separation_date (with format conversion)
        if (jsonNode.has("separationDate")) {
            Element separationDate = doc.createElement("separation_date");
            String separationDateValue = jsonNode.get("separationDate").asText();
            // Convert ISO format to MM/dd/yyyy for XML
            String formattedDate = convertDateFormat(separationDateValue);
            separationDate.appendChild(doc.createTextNode(formattedDate));
            rootElement.appendChild(separationDate);
        }

        // Add metadata
        Element submissionTime = doc.createElement("submission_timestamp");
        submissionTime.appendChild(doc.createTextNode(String.valueOf(System.currentTimeMillis())));
        rootElement.appendChild(submissionTime);

        // Convert to string
        TransformerFactory transformerFactory = TransformerFactory.newInstance();
        Transformer transformer = transformerFactory.newTransformer();
        StringWriter writer = new StringWriter();
        transformer.transform(new DOMSource(doc), new StreamResult(writer));

        return writer.getBuffer().toString();
    }

    public String xmlToJson(String xmlInput) throws Exception {
        // For now, create a simple JSON response
        // In a real implementation, you'd parse the XML and convert properly
        String jsonResponse = """
            {
                "status": "success",
                "message": "Submission received and processed",
                "timestamp": "%s",
                "processingId": "PRC-%d"
            }
            """.formatted(
                java.time.LocalDateTime.now().toString(),
                System.currentTimeMillis() % 10000
            );

        return jsonResponse;
    }

    private String convertDateFormat(String isoDate) {
        try {
            // Convert from YYYY-MM-DD to MM/dd/yyyy
            LocalDate date = LocalDate.parse(isoDate);
            return date.format(DateTimeFormatter.ofPattern("MM/dd/yyyy"));
        } catch (Exception e) {
            // If parsing fails, return original value
            return isoDate;
        }
    }

    public String extractClaimFromGraphQL(String graphQLResponse) throws Exception {
        JsonNode responseNode = objectMapper.readTree(graphQLResponse);
            if (responseNode.has("data") && responseNode.get("data").has("createClaim")) {
                return objectMapper.writeValueAsString(responseNode.get("data").get("createClaim"));
        }
    
    throw new IllegalArgumentException("Invalid GraphQL response format - cannot extract claim data");
    }
}
