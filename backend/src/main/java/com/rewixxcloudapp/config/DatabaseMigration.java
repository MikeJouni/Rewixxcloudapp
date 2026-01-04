package com.rewixxcloudapp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Database migration component that runs on application startup.
 * Ensures TEXT columns are properly set up for long text fields.
 */
@Component
public class DatabaseMigration {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigration.class);

    @Autowired
    private DataSource dataSource;

    private boolean migrationExecuted = false;

    @EventListener(ContextRefreshedEvent.class)
    @Transactional
    public void onApplicationEvent(ContextRefreshedEvent event) throws Exception {
        if (migrationExecuted) {
            return;
        }
        migrationExecuted = true;
        runMigration();
    }

    public void runMigration() throws Exception {
        logger.info("Running database migration checks...");

        try (Connection connection = dataSource.getConnection()) {
            String dbProductName = connection.getMetaData().getDatabaseProductName().toLowerCase();
            logger.info("Database type detected: {}", dbProductName);

            // Check if jobs table exists
            DatabaseMetaData metaData = connection.getMetaData();
            ResultSet tables = metaData.getTables(null, null, "jobs", new String[]{"TABLE"});

            if (!tables.next()) {
                // Try uppercase table name (some databases are case-sensitive)
                tables = metaData.getTables(null, null, "JOBS", new String[]{"TABLE"});
                if (!tables.next()) {
                    logger.info("Jobs table does not exist yet, skipping migration (will be created by Hibernate)");
                    return;
                }
            }

            // Alter columns based on database type
            try (Statement stmt = connection.createStatement()) {
                if (dbProductName.contains("postgresql")) {
                    migratePostgreSQL(stmt);
                } else if (dbProductName.contains("mysql") || dbProductName.contains("mariadb")) {
                    migrateMySQL(stmt);
                } else if (dbProductName.contains("h2")) {
                    migrateH2(stmt);
                } else {
                    logger.warn("Unknown database type: {}, skipping column type migration", dbProductName);
                }
            }

            logger.info("Database migration checks completed successfully");
        } catch (Exception e) {
            logger.error("Database migration failed: {}", e.getMessage());
            // Don't throw - let the application continue, the column type issue might not exist
        }
    }

    private void migratePostgreSQL(Statement stmt) {
        try {
            stmt.execute("ALTER TABLE jobs ALTER COLUMN description TYPE TEXT");
            logger.info("PostgreSQL: Updated description column to TEXT");
        } catch (Exception e) {
            logger.debug("PostgreSQL: description column migration skipped (may already be TEXT): {}", e.getMessage());
        }

        try {
            stmt.execute("ALTER TABLE jobs ALTER COLUMN work_site_address TYPE TEXT");
            logger.info("PostgreSQL: Updated work_site_address column to TEXT");
        } catch (Exception e) {
            logger.debug("PostgreSQL: work_site_address column migration skipped (may already be TEXT): {}", e.getMessage());
        }
    }

    private void migrateMySQL(Statement stmt) {
        try {
            stmt.execute("ALTER TABLE jobs MODIFY description TEXT");
            logger.info("MySQL: Updated description column to TEXT");
        } catch (Exception e) {
            logger.debug("MySQL: description column migration skipped: {}", e.getMessage());
        }

        try {
            stmt.execute("ALTER TABLE jobs MODIFY work_site_address TEXT");
            logger.info("MySQL: Updated work_site_address column to TEXT");
        } catch (Exception e) {
            logger.debug("MySQL: work_site_address column migration skipped: {}", e.getMessage());
        }
    }

    private void migrateH2(Statement stmt) {
        // H2 requires different syntax - we need to use ALTER COLUMN with SET DATA TYPE
        // Or for older H2 versions, use ALTER TABLE ... ALTER COLUMN ... VARCHAR(MAX)
        try {
            // Try the newer H2 syntax first
            stmt.execute("ALTER TABLE jobs ALTER COLUMN description CLOB");
            logger.info("H2: Updated description column to CLOB");
        } catch (Exception e) {
            logger.warn("H2: description column migration failed: {}", e.getMessage());
            try {
                // Try alternative syntax for older H2 versions
                stmt.execute("ALTER TABLE jobs ALTER COLUMN description VARCHAR(1000000)");
                logger.info("H2: Updated description column to VARCHAR(1000000)");
            } catch (Exception e2) {
                logger.warn("H2: description column migration alternative also failed: {}", e2.getMessage());
            }
        }

        try {
            stmt.execute("ALTER TABLE jobs ALTER COLUMN work_site_address CLOB");
            logger.info("H2: Updated work_site_address column to CLOB");
        } catch (Exception e) {
            logger.warn("H2: work_site_address column migration failed: {}", e.getMessage());
            try {
                stmt.execute("ALTER TABLE jobs ALTER COLUMN work_site_address VARCHAR(1000000)");
                logger.info("H2: Updated work_site_address column to VARCHAR(1000000)");
            } catch (Exception e2) {
                logger.warn("H2: work_site_address column migration alternative also failed: {}", e2.getMessage());
            }
        }
    }
}
