package com.rewixxcloudapp;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Value;

@SpringBootApplication
public class Application implements CommandLineRunner {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Value("${spring.datasource.url:NOT_SET}")
    private String dbUrl;

    @Value("${spring.datasource.username:NOT_SET}")
    private String dbUsername;

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("[DEBUG] Database URL: " + dbUrl);
        System.out.println("[DEBUG] Database Username: " + dbUsername);

        try {
            Integer tableCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'", Integer.class);
            System.out.println("[DB CHECK] Connected! Number of tables in 'public' schema: " + tableCount);
        } catch (Exception e) {
            System.err.println("[DB CHECK] Database connection failed: " + e.getMessage());
        }
    }
}