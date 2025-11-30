#!/usr/bin/env bash

##
## Azure one-shot deployment script for Rewixx Cloud
##
## USAGE:
##   1) Edit the CONFIG section below (passwords, region, keys).
##   2) From the repo root, run:
##        chmod +1 deploy_azure.sh
##        ./deploy_azure.sh
##
##   3) After it finishes, update `frontend/src/config.js` to use the printed
##      BACKEND and PYTHON URLs as SPRING_API_BASE and PYTHON_API_BASE,
##      then run:
##        cd frontend && npm run build && cd ..
##        az storage blob upload-batch --account-name $STORAGE_NAME -s frontend/build -d '$web'
##

set -euo pipefail

########## CONFIGURE THESE VALUES ##########

# Optional: set if you have multiple subscriptions
SUBSCRIPTION_ID=""            # e.g. "00000000-0000-0000-0000-000000000000"

RG_NAME="cloudapp"
LOCATION="eastus2"            # must be a region that supports Flexible Server in your subscription

PG_SERVER_NAME="rewixx-pg"    # must be globally unique within Azure
PG_DB_NAME="rewixxdb"
PG_ADMIN_USER="rewixxadmin"
PG_ADMIN_PASS="Mikecoded313!"   # CHANGE THIS

ACR_NAME="rewixxacr"          # must be globally unique in Azure
ENV_NAME="rewixx-env"
BACKEND_APP_NAME="rewixx-backend"
PYTHON_APP_NAME="rewixx-python"

STORAGE_NAME="rewixxstorage"  # must be globally unique (lowercase, no dashes)

GOOGLE_CLIENT_ID="767706837458-cq8og6herqn91jmd4voqc238v34tmonn.apps.googleusercontent.com"
JWT_SECRET="77eda4c175e12a344d22cef802e2290cca5efafde6825796a4c8c8bb80cccbc0"   # CHANGE THIS

VERYFI_CLIENT_ID="vrfchYZiOdKgB3wXhbFpxK6TJ4jgjxaO4NINfiu"
VERYFI_API_KEY="zainsbeihh:7fc1c1acc76e37b69f8c53f9f6dd94ff"
SERPAPI_KEY="f3395c610dbfbc2a11cdbb0850d8b83547a48dd501d5109f4c70982c7cd7ccf7"

############################################

# Show current subscription and allow override
CURRENT_SUB=$(az account show --query id -o tsv)
echo "Current Azure subscription: ${CURRENT_SUB}"

if [[ -n "${SUBSCRIPTION_ID}" ]]; then
  echo "Setting Azure subscription to ${SUBSCRIPTION_ID}..."
  az account set --subscription "${SUBSCRIPTION_ID}"
  CURRENT_SUB="${SUBSCRIPTION_ID}"
fi

echo "Using subscription: ${CURRENT_SUB}"

echo "Creating resource group ${RG_NAME} in ${LOCATION}..."
az group create -n "${RG_NAME}" -l "${LOCATION}"

echo "Ensuring Azure Database for PostgreSQL Flexible Server ${PG_SERVER_NAME} exists..."
if ! az postgres flexible-server show -g "${RG_NAME}" -n "${PG_SERVER_NAME}" >/dev/null 2>&1; then
  az postgres flexible-server create \
    -g "${RG_NAME}" \
    -n "${PG_SERVER_NAME}" \
    -u "${PG_ADMIN_USER}" \
    -p "${PG_ADMIN_PASS}" \
    -d "${PG_DB_NAME}" \
    -l "${LOCATION}" \
    --tier Burstable --sku-name standard_b1ms
else
  echo "Postgres server ${PG_SERVER_NAME} already exists, skipping creation."
fi

echo "Creating firewall rule (TEMPORARY: open to all IPs, lock down later)..."
az postgres flexible-server firewall-rule create \
  -g "${RG_NAME}" -n "${PG_SERVER_NAME}" \
  -r AllowAllAzureIps --start-ip-address 0.0.0.0 --end-ip-address 255.255.255.255

PG_FQDN=$(az postgres flexible-server show -g "${RG_NAME}" -n "${PG_SERVER_NAME}" --query fullyQualifiedDomainName -o tsv)
SPRING_DATASOURCE_URL="jdbc:postgresql://${PG_FQDN}:5432/${PG_DB_NAME}"
echo "Postgres FQDN: ${PG_FQDN}"

echo "Ensuring Azure Container Registry ${ACR_NAME} exists..."
if ! az acr show -g "${RG_NAME}" -n "${ACR_NAME}" >/dev/null 2>&1; then
  az acr create -g "${RG_NAME}" -n "${ACR_NAME}" --sku Basic
else
  echo "ACR ${ACR_NAME} already exists, skipping creation."
fi

# Enable ACR admin user and capture credentials for Container Apps
echo "Enabling admin user on ACR ${ACR_NAME}..."
az acr update -g "${RG_NAME}" -n "${ACR_NAME}" --admin-enabled true >/dev/null
ACR_USER=$(az acr credential show -n "${ACR_NAME}" --query "username" -o tsv)
ACR_PASS=$(az acr credential show -n "${ACR_NAME}" --query "passwords[0].value" -o tsv)

echo "Building backend image (rewixx-backend:latest)..."
az acr build -g "${RG_NAME}" -r "${ACR_NAME}" -t rewixx-backend:latest ./backend

echo "Building python image (rewixx-python:latest)..."
az acr build -g "${RG_NAME}" -r "${ACR_NAME}" -t rewixx-python:latest ./scripts

echo "Creating Container Apps environment ${ENV_NAME}..."
az containerapp env create \
  -g "${RG_NAME}" \
  -n "${ENV_NAME}" \
  -l "${LOCATION}"

echo "Creating backend Container App ${BACKEND_APP_NAME}..."
az containerapp create \
  -g "${RG_NAME}" \
  -n "${BACKEND_APP_NAME}" \
  --environment "${ENV_NAME}" \
  --image "${ACR_NAME}.azurecr.io/rewixx-backend:latest" \
  --target-port 8080 \
  --ingress external \
  --registry-server "${ACR_NAME}.azurecr.io" \
  --registry-username "${ACR_USER}" \
  --registry-password "${ACR_PASS}" \
  --min-replicas 1 \
  --env-vars \
    SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL}" \
    SPRING_DATASOURCE_USERNAME="${PG_ADMIN_USER}" \
    SPRING_DATASOURCE_PASSWORD="${PG_ADMIN_PASS}" \
    SPRING_JPA_HIBERNATE_DDL_AUTO="update" \
    google.oauth.client-id="${GOOGLE_CLIENT_ID}" \
    jwt.secret="${JWT_SECRET}" \
    jwt.expiration-ms="604800000"

BACKEND_FQDN=$(az containerapp show -g "${RG_NAME}" -n "${BACKEND_APP_NAME}" --query properties.configuration.ingress.fqdn -o tsv)
BACKEND_URL="https://${BACKEND_FQDN}"
echo "Backend URL: ${BACKEND_URL}"

echo "Creating Python Container App ${PYTHON_APP_NAME}..."
az containerapp create \
  -g "${RG_NAME}" \
  -n "${PYTHON_APP_NAME}" \
  --environment "${ENV_NAME}" \
  --image "${ACR_NAME}.azurecr.io/rewixx-python:latest" \
  --target-port 8000 \
  --ingress external \
  --registry-server "${ACR_NAME}.azurecr.io" \
  --registry-username "${ACR_USER}" \
  --registry-password "${ACR_PASS}" \
  --min-replicas 1 \
  --env-vars \
    VERYFI_CLIENT_ID="${VERYFI_CLIENT_ID}" \
    VERYFI_API_KEY="${VERYFI_API_KEY}" \
    SERPAPI_KEY="${SERPAPI_KEY}"

PYTHON_FQDN=$(az containerapp show -g "${RG_NAME}" -n "${PYTHON_APP_NAME}" --query properties.configuration.ingress.fqdn -o tsv)
PYTHON_URL="https://${PYTHON_FQDN}"
echo "Python API URL: ${PYTHON_URL}"

echo "==============================================="
echo "IMPORTANT: update frontend/src/config.js with:"
echo ""
echo "  SPRING_API_BASE: \"${BACKEND_URL}\""
echo "  PYTHON_API_BASE: \"${PYTHON_URL}\""
echo "  GOOGLE_CLIENT_ID: \"${GOOGLE_CLIENT_ID}\""
echo ""
echo "Then run:"
echo "  cd frontend"
echo "  npm install"
echo "  npm run build"
echo "  cd .."
echo "==============================================="

echo "Creating storage account ${STORAGE_NAME} for static website..."
if ! az storage account show -g "${RG_NAME}" -n "${STORAGE_NAME}" >/dev/null 2>&1; then
  if az storage account create \
    -g "${RG_NAME}" \
    -n "${STORAGE_NAME}" \
    -l "${LOCATION}" \
    --sku Standard_LRS 2>&1; then
    echo "Storage account created successfully."
  else
    echo "WARNING: Failed to create storage account. You may need to create it manually via Azure Portal."
    echo "Storage account name: ${STORAGE_NAME}"
    echo "Resource group: ${RG_NAME}"
    echo "Location: ${LOCATION}"
    WEB_URL=""
  fi
else
  echo "Storage account ${STORAGE_NAME} already exists, skipping creation."
  WEB_URL=$(az storage account show -g "${RG_NAME}" -n "${STORAGE_NAME}" --query "primaryEndpoints.web" -o tsv 2>/dev/null || echo "")
fi

if [[ -n "${WEB_URL}" ]]; then
  echo "Enabling static website hosting..."
  az storage blob service-properties update \
    --account-name "${STORAGE_NAME}" \
    --static-website \
    --index-document index.html \
    --error-document index.html 2>/dev/null || echo "WARNING: Failed to enable static website hosting."

  echo "Uploading initial frontend build (make sure you built it first)..."
  if [[ -d "frontend/build" ]]; then
    az storage blob upload-batch \
      --account-name "${STORAGE_NAME}" \
      -s frontend/build \
      -d '$web' 2>/dev/null || echo "WARNING: Failed to upload frontend. Build it first with: cd frontend && npm run build"
  else
    echo "WARNING: frontend/build directory not found. Build the frontend first: cd frontend && npm run build"
  fi
else
  echo "Skipping static website setup (storage account not available)."
fi

echo "======================================================"
echo "Frontend URL: ${WEB_URL}"
echo "Backend API:  ${BACKEND_URL}"
echo "Python API:   ${PYTHON_URL}"
echo "Postgres FQDN: ${PG_FQDN}"
echo "======================================================"


