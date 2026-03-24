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

        String dbUrl = getEnv("DATABASE_URL");
        String dbUser = getEnv("DB_USER");
        String dbPassword = getEnv("DB_PASSWORD");
        String dbHost = getEnv("DB_HOST");
        String dbName = getEnv("DB_NAME");
        String dbPort = getEnv("DB_PORT");

        if (dbUrl != null && !dbUrl.isBlank()) {
            // DATABASE_URL provided (supports both jdbc: and postgresql:// formats)
            System.out.println("[DATABASE] Using PostgreSQL from DATABASE_URL");
            dataSource.setDriverClassName("org.postgresql.Driver");

            String jdbcUrl = dbUrl;
            if (dbUrl.startsWith("postgresql://")) {
                // Convert postgresql://user:pass@host:port/db to jdbc format
                String withoutScheme = dbUrl.replace("postgresql://", "");
                if (withoutScheme.contains("@")) {
                    String credentials = withoutScheme.split("@")[0];
                    String hostPart = withoutScheme.split("@")[1];
                    String[] credParts = credentials.split(":", 2);
                    if (dbUser == null || dbUser.isBlank()) dbUser = credParts[0];
                    if ((dbPassword == null || dbPassword.isBlank()) && credParts.length > 1) dbPassword = credParts[1];
                    jdbcUrl = "jdbc:postgresql://" + hostPart;
                }
            }

            dataSource.setUrl(jdbcUrl);
            if (dbUser != null && !dbUser.isBlank()) dataSource.setUsername(dbUser);
            if (dbPassword != null && !dbPassword.isBlank()) dataSource.setPassword(dbPassword);

            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        }
        else if (dbHost != null && !dbHost.isBlank() && dbName != null && !dbName.isBlank()) {
            System.out.println("[DATABASE] Using PostgreSQL from individual config");
            dataSource.setDriverClassName("org.postgresql.Driver");
            String port = (dbPort != null && !dbPort.isBlank()) ? dbPort : "5432";
            dataSource.setUrl(String.format("jdbc:postgresql://%s:%s/%s", dbHost, port, dbName));
            dataSource.setUsername(dbUser != null && !dbUser.isBlank() ? dbUser : "postgres");
            dataSource.setPassword(dbPassword != null && !dbPassword.isBlank() ? dbPassword : "");

            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        }
        else {
            System.out.println("[DATABASE] No PostgreSQL config found - Using H2 in-memory database");
            dataSource.setDriverClassName("org.h2.Driver");
            dataSource.setUrl("jdbc:h2:mem:rewixxdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=PostgreSQL");
            dataSource.setUsername("sa");
            dataSource.setPassword("");
        }

        // Connection pool settings (tuned for Supabase free tier)
        dataSource.setInitialSize(2);
        dataSource.setMaxActive(10);
        dataSource.setMinIdle(2);
        dataSource.setMaxIdle(5);
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