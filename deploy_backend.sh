#!/bin/bash
# Deploy backend with forced restart to ensure new code is used

set -e

RG_NAME="cloudapp"
ACR_NAME="rewixxacrnew"
APP_NAME="rewixx-backend"

# Create a unique tag with timestamp to avoid caching issues
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
IMAGE_TAG="rewixx-backend:${TIMESTAMP}"
LATEST_TAG="rewixx-backend:latest"

echo "Building backend image with tag: ${IMAGE_TAG}..."
az acr build -g "${RG_NAME}" -r "${ACR_NAME}" -t "${IMAGE_TAG}" -t "${LATEST_TAG}" ./backend

echo ""
echo "Updating Container App with new image..."
az containerapp update \
  -g "${RG_NAME}" \
  -n "${APP_NAME}" \
  --image "${ACR_NAME}.azurecr.io/${IMAGE_TAG}"

echo ""
echo "Forcing revision restart to ensure new code is loaded..."
# Get the latest revision name
REVISION=$(az containerapp revision list \
  -g "${RG_NAME}" \
  -n "${APP_NAME}" \
  --query "[0].name" -o tsv)

if [ -n "$REVISION" ]; then
  echo "Restarting revision: ${REVISION}"
  az containerapp revision restart \
    -g "${RG_NAME}" \
    -n "${APP_NAME}" \
    --revision "${REVISION}"
else
  echo "Could not find revision to restart. The update should trigger a new revision automatically."
fi

echo ""
echo "✅ Backend deployment complete!"
echo "Image: ${ACR_NAME}.azurecr.io/${IMAGE_TAG}"
echo ""
echo "Waiting 10 seconds for container to restart..."
sleep 10

echo ""
echo "Checking container app status..."
az containerapp show \
  -g "${RG_NAME}" \
  -n "${APP_NAME}" \
  --query "{Name:name, Status:properties.provisioningState, Image:properties.template.containers[0].image}" \
  -o table

