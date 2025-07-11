package com.cutzapp.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.PropertySourcesPlaceholderConfigurer;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.Environment;

@Configuration
public class DotenvConfig {

    @Bean
    public Dotenv setupDotenv(Environment env) {
        try {
            return Dotenv.configure()
                    .ignoreIfMissing()
                    .load();
        } catch (Exception e) {
            // If .env file is not found, return null - we'll use system environment variables
            return null;
        }
    }

    @Bean
    public PropertySourcesPlaceholderConfigurer propertySourcesPlaceholderConfigurer(ConfigurableEnvironment environment) {
        Dotenv dotenv = setupDotenv(environment);
        
        // If dotenv is available (local development), use it
        if (dotenv != null) {
            dotenv.entries().forEach(entry ->
                    System.setProperty(entry.getKey(), entry.getValue())
            );
        }
        
        return new PropertySourcesPlaceholderConfigurer();
    }
}