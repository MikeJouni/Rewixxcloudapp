package com.rewixxcloudapp.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class DotenvConfig {

    @Bean
    @Primary
    public Dotenv dotenv() {
        try {
            Dotenv dotenv = Dotenv.configure()
                    .ignoreIfMissing()
                    .load();

            System.out.println("[DOTENV] Successfully loaded .env file");
            // Log the loaded environment variables (without sensitive data)
            dotenv.entries().forEach(entry -> {
                if (!entry.getKey().contains("PASSWORD")) {
                    System.out.println("[DOTENV] " + entry.getKey() + " = " + entry.getValue());
                }
            });

            return dotenv;
        } catch (Exception e) {
            System.out.println("[DOTENV] Error loading .env file: " + e.getMessage());
            System.out.println("[DOTENV] Falling back to system environment variables");
            return null;
        }
    }
}