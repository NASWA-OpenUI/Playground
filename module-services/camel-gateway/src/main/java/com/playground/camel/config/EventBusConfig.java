package com.playground.camel.config;

import org.apache.activemq.artemis.jms.client.ActiveMQConnectionFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jms.core.JmsTemplate;
import org.springframework.jms.connection.CachingConnectionFactory;

import jakarta.jms.ConnectionFactory;

@Configuration
public class EventBusConfig {

    @Bean
    public ConnectionFactory jmsConnectionFactory() {
        // Change from vm://0 to tcp://0.0.0.0:61616 for external access
        ActiveMQConnectionFactory factory = new ActiveMQConnectionFactory("tcp://0.0.0.0:61616");
        factory.setUser("admin");
        factory.setPassword("admin");
        return new CachingConnectionFactory(factory);
    }

    @Bean
    public JmsTemplate jmsTemplate(ConnectionFactory connectionFactory) {
        JmsTemplate template = new JmsTemplate(connectionFactory);
        template.setPubSubDomain(true); // Enable topic mode
        return template;
    }
}