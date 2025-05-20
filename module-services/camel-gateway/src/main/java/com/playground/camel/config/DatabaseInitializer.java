package com.playground.camel.config;

import com.playground.camel.model.InterfaceConfig;
import com.playground.camel.service.InterfaceConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private InterfaceConfigService interfaceService;

    @Override
    public void run(String... args) throws Exception {
        // Only add defaults if no configurations exist
        if (interfaceService.getAllInterfaces().isEmpty()) {
            createDefaultRestInterface();
            createDefaultSoapInterface();
            createDefaultGraphQLInterface();
            createDefaultGrpcInterface();
        }
    }

    private void createDefaultRestInterface() {
        InterfaceConfig config = new InterfaceConfig();
        config.setName("Default REST API");
        config.setProtocol("REST");
        config.setEndpoint("/api/rest");
        config.setDescription("Default REST API interface for JSON data exchange");
        config.setActive(false);
        config.setTemplate("{\n" +
                "  \"component\": \"rest\",\n" +
                "  \"path\": \"/api/rest\",\n" +
                "  \"methods\": [\"GET\", \"POST\", \"PUT\", \"DELETE\"],\n" +
                "  \"consumes\": \"application/json\",\n" +
                "  \"produces\": \"application/json\",\n" +
                "  \"errorHandler\": true\n" +
                "}");
        interfaceService.createInterface(config);
    }

    private void createDefaultSoapInterface() {
        InterfaceConfig config = new InterfaceConfig();
        config.setName("Default SOAP Service");
        config.setProtocol("SOAP");
        config.setEndpoint("/api/soap");
        config.setDescription("Default SOAP interface for XML-based web services");
        config.setActive(false);
        config.setTemplate("{\n" +
                "  \"component\": \"spring-ws\",\n" +
                "  \"path\": \"/api/soap\",\n" +
                "  \"wsdlLocation\": \"classpath:wsdl/default-service.wsdl\",\n" +
                "  \"errorHandler\": true\n" +
                "}");
        interfaceService.createInterface(config);
    }

    private void createDefaultGraphQLInterface() {
        InterfaceConfig config = new InterfaceConfig();
        config.setName("Default GraphQL API");
        config.setProtocol("GRAPHQL");
        config.setEndpoint("/api/graphql");
        config.setDescription("Default GraphQL interface for flexible data queries");
        config.setActive(false);
        config.setTemplate("{\n" +
                "  \"component\": \"graphql\",\n" +
                "  \"path\": \"/api/graphql\",\n" +
                "  \"schemaLocation\": \"classpath:graphql/schema.graphqls\",\n" +
                "  \"errorHandler\": true\n" +
                "}");
        interfaceService.createInterface(config);
    }

    private void createDefaultGrpcInterface() {
        InterfaceConfig config = new InterfaceConfig();
        config.setName("Default gRPC Service");
        config.setProtocol("GRPC");
        config.setEndpoint("/api/grpc");
        config.setDescription("Default gRPC interface for high-performance RPC");
        config.setActive(false);
        config.setTemplate("{\n" +
                "  \"component\": \"grpc\",\n" +
                "  \"path\": \"/api/grpc\",\n" +
                "  \"host\": \"0.0.0.0\",\n" +
                "  \"port\": \"50051\",\n" +
                "  \"protoLocation\": \"classpath:proto/service.proto\",\n" +
                "  \"errorHandler\": true\n" +
                "}");
        interfaceService.createInterface(config);
    }
}
