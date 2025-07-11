#!/bin/bash

# Setup Environment Variables for Rewixx Cloud App Backend
# This script helps you set up your database environment variables

echo "🚀 Setting up environment variables for Rewixx Cloud App Backend"
echo ""

# Check if .env file already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Do you want to overwrite it? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "📝 Overwriting existing .env file..."
    else
        echo "❌ Setup cancelled. Existing .env file preserved."
        exit 0
    fi
fi

# Copy template to .env
if [ -f "env.template" ]; then
    cp env.template .env
    echo "✅ Created .env file from template"
    echo ""
    echo "📋 Please edit the .env file with your actual database credentials:"
    echo "   nano .env"
    echo "   # or"
    echo "   vim .env"
    echo ""
    echo "🔧 Required variables to update:"
    echo "   - DB_HOST: Your database host (e.g., localhost, your-db-server.com)"
    echo "   - DB_PORT: Your database port (usually 5432 for PostgreSQL)"
    echo "   - DB_NAME: Your database name"
    echo "   - DB_USER: Your database username"
    echo "   - DB_PASSWORD: Your database password"
    echo ""
    echo "💡 After updating .env, you can run the application with:"
    echo "   mvn spring-boot:run"
else
    echo "❌ env.template file not found!"
    exit 1
fi 