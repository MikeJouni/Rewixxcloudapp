FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy Maven project files
COPY pom.xml .
COPY src ./src

# Build the Spring Boot jar (skip tests for faster build)
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy the built jar from the builder image
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]


