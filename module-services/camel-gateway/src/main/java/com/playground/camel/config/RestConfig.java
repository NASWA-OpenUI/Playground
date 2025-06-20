package com.playground.camel.config;

import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.model.rest.RestBindingMode;
import org.springframework.stereotype.Component;

@Component
public class RestConfig extends RouteBuilder {

    @Override
    public void configure() throws Exception {
        // Configure REST component to use servlet
        restConfiguration()
            .component("servlet")
            .bindingMode(RestBindingMode.json)
            .dataFormatProperty("prettyPrint", "true")
            .contextPath("/") // Changed from "/api" to "/" 
            .host("0.0.0.0")
            .port("8080");
    }
}