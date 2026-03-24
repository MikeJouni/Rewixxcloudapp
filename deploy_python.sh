#!/bin/bash
# Deploy Python scanning API to Railway
# Prerequisites: Install Railway CLI (npm i -g @railway/cli) and login (railway login)

set -e

echo "=== Deploying Python API to Railway ==="

cd scripts

echo "Step 1: Deploying to Railway..."
railway up --service rewixx-python

echo ""
echo "Deployment complete!"
echo "Set these environment variables in Railway dashboard:"
echo "  VERYFI_CLIENT_ID=<your-veryfi-client-id>"
echo "  VERYFI_API_KEY=<your-veryfi-api-key>"
echo "  SERPAPI_KEY=<your-serpapi-key>"
