# Docker Deployment

## Current deployment shape

- Single Docker image built from the repository `Dockerfile`
- Multi-stage build: frontend compiled first, then copied into the Python runtime image
- Runtime container serves the React SPA with Nginx and proxies `/api/*` to FastAPI
- SQLite is still used for the first Azure rollout

## Azure target

The recommended first production target for this repository is **Azure App Service for Containers**.

That choice fits the current architecture well because the app is already packaged as one web container and does not need multi-service orchestration yet.

## GitHub Actions pipeline

The repository includes `.github/workflows/azure-deploy.yml`.

The workflow triggers on:
- pushes to `main`
- manual `workflow_dispatch`

The workflow does four things:
1. Runs backend tests with `pytest`
2. Builds the frontend with `npm run build`
3. Builds and pushes the Docker image to Azure Container Registry (ACR)
4. Deploys the pushed image to Azure App Service

## GitHub configuration

Add these **GitHub Actions secrets**:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Add these **GitHub Actions variables**:

- `AZURE_ACR_NAME`
- `AZURE_WEBAPP_NAME`
- `AZURE_WEBAPP_URL` (optional, used for the post-deploy health check)

Recommended:
- create a `production` GitHub environment
- add required reviewers there if you want manual approval before deploy

## Azure one-time setup

You need these Azure resources:

- a resource group
- an Azure Container Registry
- an Azure App Service plan for Linux
- an Azure Web App for Containers

You also need an Azure identity for GitHub Actions that uses **OpenID Connect (OIDC)** instead of a long-lived client secret.

Grant the GitHub deployment identity:
- `AcrPush` on the ACR resource
- permission to deploy the web app, typically `Contributor` scoped to the web app or its resource group

## App Service container configuration

Configure the App Service app with these app settings:

- `WEBSITES_PORT=80`
- `WEBSITES_ENABLE_APP_SERVICE_STORAGE=true`
- `DATABASE_URL=sqlite:////home/ecm.db`
- `JWT_SECRET=<strong-random-secret>`

Notes:
- The workflow deploys the container image, but the app settings above should be configured in Azure once.
- `DATABASE_URL=sqlite:////home/ecm.db` keeps the database on App Service persistent storage under `/home`.
- This is acceptable for an initial single-instance deployment, but it is not a good long-term scaling model.

## ACR pull access for App Service

If the ACR registry is private, the App Service app must be able to pull from it.

Recommended setup:
1. Enable a system-assigned managed identity on the web app.
2. Grant that identity the `AcrPull` role on the ACR resource.

That keeps registry pull access in Azure rather than storing registry passwords in GitHub.

## Suggested Azure CLI checks

After creating the web app, configure the runtime settings:

```bash
az webapp config appsettings set \
  --resource-group <resource-group> \
  --name <webapp-name> \
  --settings \
    WEBSITES_PORT=80 \
    WEBSITES_ENABLE_APP_SERVICE_STORAGE=true \
    DATABASE_URL='sqlite:////home/ecm.db' \
    JWT_SECRET='<strong-random-secret>'
```

To let the web app pull private images from ACR:

```bash
WEBAPP_PRINCIPAL_ID=$(az webapp identity assign \
  --resource-group <resource-group> \
  --name <webapp-name> \
  --query principalId \
  --output tsv)

ACR_ID=$(az acr show \
  --name <acr-name> \
  --query id \
  --output tsv)

az role assignment create \
  --assignee-object-id "$WEBAPP_PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --role AcrPull \
  --scope "$ACR_ID"
```

## Operational caveats

- SQLite on App Service is acceptable for a first deployment, but avoid scaling out to multiple instances.
- Startup currently runs `python seed.py` before the web server starts; treat that as part of production rollout behavior.
- A managed database should be the next hardening step after the first successful Azure deployment.
