# Rewixx Cloud App Backend

This is the Spring Boot backend for the Rewixx Cloud App, providing REST APIs for the electrical services application.

## Features

- **JPA/Hibernate Integration**: Full JPA support with Hibernate ORM
- **PostgreSQL Database**: Production-ready database configuration
- **AWS S3 Integration**: File storage for receipt images and documents
- **REST APIs**: RESTful endpoints for all entities
- **Auto Table Updates**: Tables are automatically updated on application startup
- **Connection Pooling**: Optimized database connection management

## Configuration

### Environment Variables

The application requires the following environment variables which are found in the env file in the shared google drive folder. just place that file at the root of the backend repo:

```bash
# Database Configuration
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

### Database Configuration

- **DDL Auto**: Set to `update` - tables will be updated on startup
- **Dialect**: PostgreSQL dialect configured
- **Connection Pool**: HikariCP with optimized settings
- **SSL**: Required for production database connections

### AWS S3 Setup

1. Create an S3 bucket for file storage
2. Configure CORS for the bucket to allow uploads from your frontend domain
3. Set up IAM user with S3 permissions
4. Add the credentials to your environment variables

## Running the Application

### Prerequisites

- Java 11 or higher
- Maven 3.6 or higher
- PostgreSQL database
- AWS S3 bucket

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

### File Upload
- `POST /api/files/upload` - Upload receipt images to S3
  - Accepts multipart form data with "file" parameter
  - Returns S3 URL of uploaded file

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