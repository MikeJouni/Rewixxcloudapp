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
        // Use H2 in-memory database for development
        DataSource dataSource = new DataSource();
        dataSource.setDriverClassName("org.h2.Driver");
        dataSource.setUrl("jdbc:h2:mem:rewixxdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL");
        dataSource.setUsername("sa");
        dataSource.setPassword("");

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

        System.out.println("[DATABASE] Using H2 in-memory database");
        System.out.println("[DATABASE] H2 Console available at: http://localhost:8080/h2-console");
        System.out.println("[DATABASE] JDBC URL: jdbc:h2:mem:rewixxdb");

        return dataSource;
    }
}