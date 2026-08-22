# API Deployment

This project deploys the Azure Functions API with GitHub Actions and Bicep.

## Target Architecture

```text
GitHub Actions
  -> Azure OIDC login
  -> Bicep deployment
  -> API Management OpenAPI import
  -> Azure Functions package deploy
  -> Azure SQL schema/procedure scripts

Azure
  -> Resource Group
  -> API Management
  -> Storage Account
  -> Log Analytics
  -> Application Insights
  -> Linux Consumption Azure Function App
  -> Azure SQL Server
  -> Azure SQL Database
```

## GitHub Configuration

Create GitHub environments named:

```text
dev
staging
prod
```

Add these environment variables:

| Variable | Example |
| --- | --- |
| `AZURE_CLIENT_ID` | `<federated-app-client-id>` |
| `AZURE_TENANT_ID` | `<tenant-id>` |
| `AZURE_SUBSCRIPTION_ID` | `<subscription-id>` |
| `SQL_ADMIN_LOGIN` | `sqladminuser` |
| `JWT_AUTHORITY` | `https://login.microsoftonline.com/<tenant-id>/v2.0` |
| `JWT_AUDIENCE` | `api://<api-client-id>` |
| `CORS_ALLOWED_ORIGINS` | `["https://example.com","http://localhost:5173"]` |
| `APIM_PUBLISHER_EMAIL` | `owner@example.com` |
| `APIM_PUBLISHER_NAME` | `Task Management` |

Add this environment secret:

| Secret | Purpose |
| --- | --- |
| `SQL_ADMIN_PASSWORD` | SQL administrator password used by Bicep and SQL migration scripts. |

Use GitHub OIDC/federated credentials for Azure login. Do not store Azure client secrets.

## Azure OIDC Setup

Create an Entra ID app registration or managed identity for GitHub Actions, then add a federated credential:

```text
Issuer: https://token.actions.githubusercontent.com
Subject: repo:<owner>/<repo>:environment:dev
Audience: api://AzureADTokenExchange
```

Repeat the federated credential per environment if using `staging` and `prod`.

Assign the identity the minimum required Azure roles on the target subscription or resource group:

```text
Contributor
User Access Administrator only if future role assignments are added by Bicep
```

The current Bicep template does not create RBAC role assignments, so `Contributor` scoped to the deployment resource group is enough for the baseline.

## Manual Deployment

Use the GitHub Actions workflow:

```text
.github/workflows/deploy-api.yml
```

Run it manually with:

```text
Actions -> deploy-api -> Run workflow
```

Inputs:

| Input | Example |
| --- | --- |
| `environment` | `dev` |
| `location` | `eastus` |

The workflow:

1. Logs in to Azure with OIDC.
2. Creates or updates the resource group.
3. Deploys `infra/main.bicep`.
4. Imports `docs/swagger.json` into API Management.
5. Builds and tests the API.
6. Publishes a zip package to the Function App.
7. Opens a temporary SQL firewall rule for the runner.
8. Applies `sql/001_schema.sql` and `sql/002_stored_procedures.sql`.
9. Removes the temporary SQL firewall rule.

After deployment, API Management exposes the public API at:

```text
https://<apim-name>.azure-api.net/api
```

Use that URL as the frontend API base URL:

```bash
VITE_API_BASE_URL=https://<apim-name>.azure-api.net/api
```

## Local IaC Deployment

For local testing:

```bash
az login
az group create --name rg-task-management-dev --location eastus
az deployment group create \
  --resource-group rg-task-management-dev \
  --template-file infra/main.bicep \
  --parameters @infra/params.dev.json \
  --parameters sqlAdministratorPassword='<secure-password>'
```

Then publish the API:

```bash
cd api
func azure functionapp publish <function-app-name>
```

## Security Notes

- The workflow uses OIDC, not long-lived Azure credentials.
- SQL admin password is a GitHub environment secret.
- The SQL firewall rule for GitHub Actions is temporary and deleted in an `always()` cleanup step.
- Application Insights and Log Analytics are created by IaC for observability.
- API Management exposes the public API facade and forwards traffic to Azure Functions.
- Production should protect the `prod` GitHub environment with required reviewers.

## Known Follow-Ups

- Move SQL auth to Microsoft Entra authentication or Key Vault references.
- Restrict direct Function App access so public clients must go through API Management.
- Add API Management JWT validation and rate-limit policies.
- Add Bicep validation and security scanning in CI.
- Add deployment approvals for staging and production.
- Add artifact retention and rollback instructions.
