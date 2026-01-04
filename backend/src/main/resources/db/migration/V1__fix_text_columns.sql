-- Migration to fix TEXT column types for description and work_site_address in jobs table
-- This migration should be run manually if the columns are currently VARCHAR(255)

-- For PostgreSQL:
-- ALTER TABLE jobs ALTER COLUMN description TYPE TEXT;
-- ALTER TABLE jobs ALTER COLUMN work_site_address TYPE TEXT;

-- For MySQL:
-- ALTER TABLE jobs MODIFY description TEXT;
-- ALTER TABLE jobs MODIFY work_site_address TEXT;

-- For H2 (development):
-- ALTER TABLE jobs ALTER COLUMN description TEXT;
-- ALTER TABLE jobs ALTER COLUMN work_site_address TEXT;

-- Note: The application uses Hibernate with ddl-auto=update, but Hibernate doesn't
-- automatically change column types from VARCHAR to TEXT. If you're experiencing
-- DataException errors when saving long text, run the appropriate ALTER statements above.
