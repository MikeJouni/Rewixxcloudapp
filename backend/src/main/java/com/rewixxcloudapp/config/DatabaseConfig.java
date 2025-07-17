package com.rewixxcloudapp.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.apache.tomcat.jdbc.pool.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.sql.SQLException;

@Configuration
public class DatabaseConfig {

    @Bean
    public javax.sql.DataSource dataSource() throws SQLException {
        Dotenv dotenv = Dotenv.load();

        DataSource dataSource = new DataSource();

        dataSource.setDriverClassName("org.postgresql.Driver");
        dataSource.setUrl("jdbc:postgresql://" + dotenv.get("DB_HOST") + ":" + dotenv.get("DB_PORT") + "/"
                + dotenv.get("DB_NAME"));
        dataSource.setUsername(dotenv.get("DB_USER"));
        dataSource.setPassword(dotenv.get("DB_PASSWORD"));

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

        // SSL settings for production
        dataSource.setConnectionProperties("ssl=true;sslmode=require");

        return dataSource;
    }
}