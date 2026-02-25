package com.rewixxcloudapp.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.apache.tomcat.jdbc.pool.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

@Configuration
public class DatabaseConfig {

    private final Dotenv dotenv;
    private final Environment environment;

    @Autowired
    public DatabaseConfig(@Autowired(required = false) Dotenv dotenv, Environment environment) {
        this.dotenv = dotenv;
        this.environment = environment;
    }

    private String getEnv(String key) {
        if (dotenv != null) {
            String value = dotenv.get(key);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        String systemValue = System.getenv(key);
        return systemValue;
    }

    private void requireNotBlank(String value, String name) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required environment variable: " + name);
        }
    }

    private boolean isProdProfileActive() {
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        return false;
    }


    @Bean
    @Profile("!test")
    public javax.sql.DataSource dataSource() {
        DataSource dataSource = new DataSource();
        
        // Check for PostgreSQL environment variables (production)
        String dbUrl = getEnv("DATABASE_URL");
        String dbHost = getEnv("DB_HOST");
        String dbName = getEnv("DB_NAME");
        String dbUser = getEnv("DB_USER");
        String dbPassword = getEnv("DB_PASSWORD");
        String dbPort = getEnv("DB_PORT");
        
        // If DATABASE_URL is provided (common in Azure/cloud environments)
        if (dbUrl != null && !dbUrl.isBlank()) {
            System.out.println("[DATABASE] Using PostgreSQL from DATABASE_URL");
            dataSource.setDriverClassName("org.postgresql.Driver");
            dataSource.setUrl(dbUrl);
            
            // Extract username and password from URL if not provided separately
            if (dbUser == null || dbUser.isBlank()) {
                // Try to extract from URL format: postgresql://user:pass@host:port/dbname
                if (dbUrl.contains("@")) {
                    String[] parts = dbUrl.split("@")[0].replace("postgresql://", "").split(":");
                    if (parts.length >= 2) {
                        dbUser = parts[0];
                        dbPassword = parts[1];
                    }
                }
            }
            
            if (dbUser != null && !dbUser.isBlank()) {
                dataSource.setUsername(dbUser);
            }
            if (dbPassword != null && !dbPassword.isBlank()) {
                dataSource.setPassword(dbPassword);
            }
            
            // Set PostgreSQL dialect for Hibernate
            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
            System.out.println("[DATABASE] Set Hibernate dialect to PostgreSQLDialect");
        }
        // If individual PostgreSQL config is provided
        else if (dbHost != null && !dbHost.isBlank() && dbName != null && !dbName.isBlank()) {
            System.out.println("[DATABASE] Using PostgreSQL from individual config");
            dataSource.setDriverClassName("org.postgresql.Driver");
            String port = (dbPort != null && !dbPort.isBlank()) ? dbPort : "5432";
            dataSource.setUrl(String.format("jdbc:postgresql://%s:%s/%s", dbHost, port, dbName));
            dataSource.setUsername(dbUser != null && !dbUser.isBlank() ? dbUser : "postgres");
            dataSource.setPassword(dbPassword != null && !dbPassword.isBlank() ? dbPassword : "");
            
            // Set PostgreSQL dialect for Hibernate
            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
            System.out.println("[DATABASE] Set Hibernate dialect to PostgreSQLDialect");
        }
        // Fallback to H2 in-memory database for development
        else {
            System.out.println("[DATABASE] ⚠️  No PostgreSQL config found - Using H2 in-memory database (data will be lost on restart!)");
            System.out.println("[DATABASE] To use PostgreSQL, set environment variables: DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD");
            dataSource.setDriverClassName("org.h2.Driver");
            dataSource.setUrl("jdbc:h2:mem:rewixxdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL");
            dataSource.setUsername("sa");
            dataSource.setPassword("");
            System.out.println("[DATABASE] H2 Console available at: http://localhost:8080/h2-console");
        }

        // Connection pool settings
        dataSource.setInitialSize(5);
        dataSource.setMaxActive(20);
        dataSource.setMinIdle(5);
        dataSource.setMaxIdle(10);
        dataSource.setMaxWait(30000);

        // Connection validation
        dataSource.setValidationQuery("SELECT 1");
        dataSource.setTestOnBorrow(true);
        dataSource.setTestWhileIdle(true);

        System.out.println("[DATABASE] JDBC URL: " + dataSource.getUrl());
        System.out.println("[DATABASE] Username: " + dataSource.getUsername());

        return dataSource;
    }
}