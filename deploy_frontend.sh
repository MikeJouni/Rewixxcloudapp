#!/bin/bash
# Deploy frontend to Azure Static Web Apps
# Prerequisites: Azure CLI installed and logged in, SWA CLI installed (npm i -g @azure/static-web-apps-cli)

set -e

echo "=== Deploying Frontend to Azure Static Web Apps ==="

cd frontend

echo "Step 1: Installing dependencies..."
npm install

echo ""
echo "Step 2: Building frontend..."
npm run build

echo ""
echo "Step 3: Deploying to Azure Static Web Apps..."
swa deploy ./build --env production

echo ""
echo "Frontend deployment complete!"
