package com.playground.camel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = "com.playground.camel")
public class CamelGatewayApp {
    public static void main(String[] args) {
        SpringApplication.run(CamelGatewayApp.class, args);
    }
}