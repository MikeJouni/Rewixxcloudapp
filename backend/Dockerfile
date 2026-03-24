FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy Maven project files (context may be repo root or backend/)
COPY backend/pom.xml pom.xml
COPY backend/src ./src

# Build the Spring Boot jar (skip tests for faster build)
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy the built jar from the builder image
COPY --from=builder /app/target/*.jar app.jar

# Railway assigns PORT dynamically
ENV PORT=8080
EXPOSE ${PORT}

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
