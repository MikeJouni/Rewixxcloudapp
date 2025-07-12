# Rewixx Cloud App Backend

This is the Spring Boot backend for the Rewixx Cloud App, providing REST APIs for the electrical services application.

## Features

- **JPA/Hibernate Integration**: Full JPA support with Hibernate ORM
- **PostgreSQL Database**: Production-ready database configuration
- **REST APIs**: RESTful endpoints for all entities
- **Auto Table Updates**: Tables are automatically updated on application startup
- **Connection Pooling**: Optimized database connection management

## Configuration

### Environment Variables

The application requires the following environment variables which are found in the env file in the shared google drive folder. just place that file at the root of the backend repo:

```bash
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
```

### Database Configuration

- **DDL Auto**: Set to `update` - tables will be updated on startup
- **Dialect**: PostgreSQL dialect configured
- **Connection Pool**: HikariCP with optimized settings
- **SSL**: Required for production database connections

## Running the Application

### Prerequisites

- Java 11 or higher
- Maven 3.6 or higher
- PostgreSQL database

### Development

```bash
# Run with Maven
mvn spring-boot:run

# Or build and run
mvn clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### Testing

```bash
# Run tests
mvn test

# Run with test profile (uses H2 in-memory database)
mvn spring-boot:run -Dspring.profiles.active=test
```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/username/{username}` - Get user by username
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

## Entity Structure

The application includes the following entities:
- User
- Customer
- Product
- Sale
- SaleItem
- Supplier
- Tender
- Role
- Currency

## Database Schema

Tables are automatically created and updated based on the JPA entities. The `ddl-auto=update` setting ensures that:

- New tables are created for new entities
- Existing tables are updated when entity structure changes
- Data is preserved during updates

## Logging

The application includes detailed SQL logging for development:
- SQL queries are logged at DEBUG level
- Parameter binding is logged at TRACE level
- SQL formatting is enabled for readability 