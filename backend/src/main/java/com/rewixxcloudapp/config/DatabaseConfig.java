package com.rewixxcloudapp.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.apache.tomcat.jdbc.pool.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import java.sql.SQLException;

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
    public javax.sql.DataSource dataSource() throws SQLException {
        String host = getEnv("DB_HOST");
        String port = getEnv("DB_PORT");
        String dbName = getEnv("DB_NAME");
        String user = getEnv("DB_USER");
        String password = getEnv("DB_PASSWORD");

        requireNotBlank(host, "DB_HOST");
        requireNotBlank(port, "DB_PORT");
        requireNotBlank(dbName, "DB_NAME");
        requireNotBlank(user, "DB_USER");
        requireNotBlank(password, "DB_PASSWORD");

        DataSource dataSource = new DataSource();
        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setUrl("jdbc:postgresql://" + host + ":" + port + "/" + dbName);
        dataSource.setUsername(user);
        dataSource.setPassword(password);

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

        // SSL conditional based on active profile
        String connectionProperties = isProdProfileActive() ? "ssl=true;sslmode=require" : "ssl=false;sslmode=disable";
        dataSource.setConnectionProperties(connectionProperties);

        return dataSource;
    }
}