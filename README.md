# Task Management App

Full-stack task management application built for the Senior Software Engineer technical test.

The solution includes a React frontend, a C# Azure Functions API, Azure SQL scripts, Bicep infrastructure, API Management exposure, and GitHub Actions deployment.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Routing | React Router data routes with lazy-loaded pages |
| Forms | react-hook-form |
| State | Zustand and react-auth-kit |
| API client | Kubb-generated React Query hooks from OpenAPI |
| Backend | C# Azure Functions isolated worker |
| Database | Azure SQL Server |
| IaC | Azure Bicep |
| CI/CD | GitHub Actions with Azure OIDC |
| API Gateway | Azure API Management |

## Repository Structure

```text
api/                 C# Azure Functions API
client/              React + TypeScript frontend
docs/                Architecture, deployment, and OpenAPI docs
infra/               Azure Bicep infrastructure
sql/                 SQL schema and stored procedures
tests/               xUnit backend tests
.github/workflows/   CI and deployment workflows
```

## Requirements

- Git
- Node.js 20 LTS or newer
- pnpm 9.7.1 or newer
- .NET SDK 10.x
- Azure Functions Core Tools v4
- SQL Server, Azure SQL Edge, or a Docker SQL Server image
- Azure CLI
- Bicep CLI

Optional:

- Azure Data Studio or `sqlcmd`
- Docker Desktop
- Postman or Swagger Editor

## Local Setup

Install frontend dependencies:

```bash
cd client
pnpm install
pnpm run api:generate
```

Create the local database:

```bash
sqlcmd -S localhost,1433 -U sa -P '<password>' -Q "CREATE DATABASE TaskManagement"
sqlcmd -S localhost,1433 -U sa -P '<password>' -d TaskManagement -i sql/001_schema.sql
sqlcmd -S localhost,1433 -U sa -P '<password>' -d TaskManagement -i sql/002_stored_procedures.sql
```

Create `api/local.settings.json` for local secrets:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "dotnet-isolated",
    "SqlConnectionString": "Server=localhost,1433;Database=TaskManagement;User Id=sa;Password=<password>;TrustServerCertificate=True;",
    "Jwt__Authority": "https://login.microsoftonline.com/<tenant-id>/v2.0",
    "Jwt__Audience": "api://<api-client-id>",
    "Cors__AllowedOrigins": "http://localhost:5173"
  }
}
```

`api/local.settings.json` is intentionally ignored by git.

## Run Locally

Start the API:

```bash
cd api
dotnet restore
func start --dotnet-isolated --port 7073
```

Start the frontend in another terminal:

```bash
cd client
pnpm run dev
```

Local URLs:

```text
Frontend: http://localhost:5173
API:      http://localhost:7073/api
```

Frontend environment variables:

```bash
VITE_API_BASE_URL=http://localhost:7073/api
VITE_AUTH_AUTHORITY=https://login.microsoftonline.com/<tenant-id>/v2.0
VITE_AUTH_CLIENT_ID=<spa-client-id>
VITE_AUTH_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_AUTH_SCOPE=api://<api-client-id>/Tasks.Access
```

## API

The OpenAPI contract lives at:

```text
docs/swagger.json
```

Core endpoints:

```text
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/register
GET    /api/auth/me
GET    /api/tasks
GET    /api/tasks/{id}
POST   /api/tasks
PUT    /api/tasks/{id}
PATCH  /api/tasks/{id}/status
DELETE /api/tasks/{id}
GET    /api/tasks/stream
```

Example filtered request:

```text
GET /api/tasks?status=Pending&assignedTo=<user-id>&search=invoice&sortBy=dueDate&sortDirection=asc&page=1&pageSize=20
```

The frontend consumes generated hooks from Kubb. Regenerate them after changing `docs/swagger.json`:

```bash
cd client
pnpm run api:generate
```

Generated files under `client/src/__generated__/` are ignored because they are reproducible from the OpenAPI contract.

API responses are standardized:

```json
{
  "data": {},
  "code": "TASK_RETRIEVED",
  "status": "ok",
  "message": "Task retrieved successfully."
}
```

Errors use the same envelope and stable codes from the backend error catalog:

```json
{
  "data": null,
  "code": "TASK_NOT_FOUND",
  "status": "error",
  "message": "Task was not found."
}
```

## Authentication

The app supports Microsoft, Google, and GitHub login through a single external identity broker such as Microsoft Entra External ID, Azure AD B2C, Auth0, Firebase Auth, or Clerk.

The backend does not store passwords. Login works like this:

```text
User chooses Microsoft, Google, or GitHub
  -> identity broker issues JWT access token
  -> frontend stores token with react-auth-kit
  -> frontend calls POST /api/auth/login
  -> backend validates identity claims and upserts local user profile
```

Registration creates or updates the local application profile linked to the external identity:

```text
POST /api/auth/register
```

The profile is stored in `dbo.Users` using the external stable claim as `ExternalId`.

## Tests

Backend:

```bash
dotnet test tests/TaskManagement.Tests.csproj
```

Frontend:

```bash
cd client
pnpm run api:generate
pnpm test
pnpm run build
```

## CI

GitHub Actions runs on pushes to `main` and `develop`, and on pull requests.

Backend CI restores the solution and runs the xUnit project in Release mode:

```bash
dotnet restore TaskManagement.sln
dotnet test tests/TaskManagement.Tests.csproj --configuration Release --no-restore -- RunConfiguration.TreatNoTestsAsError=true
```

Frontend CI installs pnpm with `pnpm/action-setup@v4` before `actions/setup-node@v4` enables the pnpm cache, then runs:

```bash
cd client
pnpm install --frozen-lockfile
pnpm run api:generate
pnpm test
pnpm run build
```

The docs job validates `docs/swagger.json` with Python's JSON parser.

## Deployment

Deployment is handled by GitHub Actions:

```text
.github/workflows/deploy-api.yml
```

### Local Bicep Deploy

You can deploy the Bicep infrastructure from your local machine with `scripts/deploy-local.sh`.

Install the required tools first:

```bash
az version
az bicep version
jq --version
```

If one is missing, the script stops before deployment and prints the install command or documentation link.

Set the non-secret deployment values:

```bash
export AZURE_SUBSCRIPTION_ID='<subscription-id>'
export AZURE_TENANT_ID='<tenant-id>'
export APIM_PUBLISHER_EMAIL='me@example.com'
export APIM_PUBLISHER_NAME='Task Management'
export CORS_ALLOWED_ORIGINS='["http://localhost:5173"]'
export JWT_AUTHORITY='https://login.microsoftonline.com/<tenant-id>/v2.0'
export JWT_AUDIENCE='api://<api-client-id>'
export SQL_ADMIN_LOGIN='sqladminuser'
```

Run a preview first:

```bash
./scripts/deploy-local.sh dev --what-if
```

Then deploy:

```bash
./scripts/deploy-local.sh dev
```

The script reads `SQL_ADMIN_PASSWORD` from the environment or prompts for it securely. Do not commit the SQL password to any file.

Useful flags:

```text
--location <location>
--subscription <id>
--tenant <id>
--resource-group <name>
--app-name <name>
--params <file>
--skip-login-check
--what-if
```

The workflow deploys:

- Azure Resource Group
- Azure SQL Server and database
- Storage Account
- Log Analytics and Application Insights
- Azure Function App
- Azure API Management
- SQL schema and stored procedures

Required GitHub environment variables:

```text
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
SQL_ADMIN_LOGIN
JWT_AUTHORITY
JWT_AUDIENCE
CORS_ALLOWED_ORIGINS
APIM_PUBLISHER_EMAIL
APIM_PUBLISHER_NAME
```

Required GitHub environment secret:

```text
SQL_ADMIN_PASSWORD
```

Run the deployment manually from GitHub:

```text
Actions -> deploy-api -> Run workflow
```

After deployment, API Management exposes the API at:

```text
https://<apim-name>.azure-api.net/api
```

Use that value as `VITE_API_BASE_URL` for hosted frontend environments.

## Azure Functions Deployment Model

This project deploys one Azure Function App that contains multiple HTTP-triggered functions:

```text
CreateTaskFunction
ListTasksFunction
GetTaskByIdFunction
UpdateTaskFunction
UpdateTaskStatusFunction
DeleteTaskFunction
```

Each function maps to one API operation, while shared application classes stay inside the same deployment package:

```text
TaskService
SqlTaskRepository
TaskFactory
JwtPrincipalReader
```

I prefer this model over deploying one separate Function App per service because it keeps the architecture simple without losing separation of concerns. The HTTP boundary stays clean, API Management can expose all routes from one backend, and SOLID responsibilities remain in the code through interfaces, dependency injection, services, repositories, DTOs, and factories.

Deploying one Function App per internal service would add more infrastructure, more configuration, more API Management backend mappings, more deployment steps, more monitoring surfaces, and more duplicated shared-code handling. That approach makes sense for independently scaling bounded contexts, but it is unnecessary for this technical test.

The chosen model is:

```text
1 Azure Function App
  -> multiple HTTP functions
  -> shared services through dependency injection
  -> Azure SQL persistence
  -> Azure API Management public facade
```

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)
- [OpenAPI contract](docs/swagger.json)
- [Implementation plan](docs/superpowers/plans/2026-08-22-task-management-app.md)

## Notes

- The API follows SOLID-oriented boundaries: Functions, Services, Repositories, DTOs, Domain, and Factories.
- Services return a standard `{ data, code, status, message }` envelope and use a central error dictionary.
- Azure Functions handle HTTP/security concerns, then delegate business workflows to DI-managed services.
- Microsoft, Google, and GitHub login are handled by an external identity broker; the backend uses one JWT/security path.
- Authentication state is managed with `react-auth-kit`.
- Task UI state is managed with Zustand.
- Forms use `react-hook-form`.
- Routing uses React Router data mode and lazy-loaded feature pages.
- Public API exposure is intended to go through Azure API Management.
