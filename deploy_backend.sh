#!/bin/bash
# Deploy Java backend to Railway
# Prerequisites: Install Railway CLI (npm i -g @railway/cli) and login (railway login)

set -e

echo "=== Deploying Java Backend to Railway ==="

cd backend

echo "Step 1: Deploying to Railway..."
railway up --service rewixx-backend

echo ""
echo "Deployment complete!"
echo "Set these environment variables in Railway dashboard:"
echo "  DATABASE_URL=jdbc:postgresql://db.vksyhpnomsjsomryrywl.supabase.co:5432/postgres"
echo "  DB_USER=postgres"
echo "  DB_PASSWORD=<your-supabase-password>"
echo "  JWT_SECRET=<your-jwt-secret>"
echo "  GOOGLE_OAUTH_CLIENT_ID=<your-google-client-id>"
