package gov.dol.ui.demo.integration.config;

import org.apache.camel.component.servlet.CamelHttpTransportServlet;
import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration to register CamelServlet with Spring Boot
 * This enables Camel REST endpoints to be served through Spring Boot's embedded server
 */
@Configuration
public class CamelServletConfig {

    @Bean
    public ServletRegistrationBean<CamelHttpTransportServlet> camelServletRegistrationBean() {
        ServletRegistrationBean<CamelHttpTransportServlet> registration = 
            new ServletRegistrationBean<>(new CamelHttpTransportServlet(), "/*");
        
        registration.setName("CamelServlet");
        registration.setLoadOnStartup(1);
        
        return registration;
    }
}