package com.rewixxcloudapp.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Autowired
    private Dotenv dotenv;

    @Bean
    @Primary
    public DataSource dataSource() {
        String dbHost = getEnvValue("DB_HOST", "localhost");
        String dbPort = getEnvValue("DB_PORT", "5432");
        String dbName = getEnvValue("DB_NAME", "postgres");
        String dbUser = getEnvValue("DB_USER", "postgres");
        String dbPassword = getEnvValue("DB_PASSWORD", "");

        System.out.println("[DATABASE CONFIG] DB_HOST: " + dbHost);
        System.out.println("[DATABASE CONFIG] DB_PORT: " + dbPort);
        System.out.println("[DATABASE CONFIG] DB_NAME: " + dbName);
        System.out.println("[DATABASE CONFIG] DB_USER: " + dbUser);

        String url = String.format("jdbc:postgresql://%s:%s/%s?sslmode=require",
                dbHost, dbPort, dbName);

        return DataSourceBuilder.create()
                .url(url)
                .username(dbUser)
                .password(dbPassword)
                .driverClassName("org.postgresql.Driver")
                .build();
    }

    private String getEnvValue(String key, String defaultValue) {
        if (dotenv != null) {
            String value = dotenv.get(key);
            if (value != null && !value.isEmpty()) {
                return value;
            }
        }

        // Fallback to system environment variables
        String systemValue = System.getenv(key);
        return systemValue != null ? systemValue : defaultValue;
    }
}