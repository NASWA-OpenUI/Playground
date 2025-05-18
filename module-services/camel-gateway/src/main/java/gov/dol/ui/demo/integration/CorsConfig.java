package gov.dol.ui.demo.integration.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * CORS configuration for the unified gateway service
 * Allows cross-origin requests from different UI applications
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        
        // Allow requests from different UI ports during development
        config.addAllowedOrigin("http://localhost:3001");  // Claimant UI
        config.addAllowedOrigin("http://localhost:3002");  // Claims Processing UI
        config.addAllowedOrigin("http://localhost:8081");  // Demo UI
        config.addAllowedOrigin("http://localhost");       // Production
        config.addAllowedOrigin("http://localhost:80");    // Production explicit
        
        // Allow all headers and methods
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}