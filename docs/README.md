# Task Management App Documentation

Full-stack technical-test implementation for a task management web application with Azure integration.

The application allows authenticated users to register or sign in, manage tasks, filter and sort task lists, and receive task-status updates in real time. The target stack follows the assessment requirements:

- Frontend: React, TypeScript, Tailwind CSS, React Router, react-auth-kit, react-hook-form, Zustand, and Kubb-generated API hooks
- Backend: C# Azure Functions
- Database: Azure SQL Server
- Authentication: OAuth2/OpenID Connect with JWT validation
- API documentation: RESTful API with Swagger/OpenAPI
- Tests: xUnit and Moq
- DevOps: GitHub Actions-ready repository structure

## Repository Structure

```text
client/              React + TypeScript frontend
api/                 C# Azure Functions backend
sql/                 Azure SQL schema, indexes, and stored procedures
docs/                README, architecture notes, OpenAPI/Swagger assets
tests/               xUnit and Moq backend tests
.github/workflows/   CI/CD workflow definitions
```

## Local Development

### Tools and Software Required

Install these tools before running the project locally:

| Tool | Required Version | Purpose |
| --- | --- | --- |
| Git | 2.40 or newer | Clone the repository and follow the Git Flow branching model. |
| Node.js | 20 LTS or newer | Run the React + TypeScript frontend. |
| pnpm | 9.7.1 or newer | Install and run frontend dependencies and scripts. |
| .NET SDK | 10.x for this workspace | Build the C# Azure Functions API and run xUnit tests. Install .NET 8 SDK and retarget `api/TaskManagement.Api.csproj` to `net8.0` if the delivery environment requires .NET 8 specifically. |
| Azure Functions Core Tools | v4 | Run the Azure Functions backend locally with `func start`. |
| SQL Server tooling | `sqlcmd` or Azure Data Studio | Create the local database and run schema/stored procedure scripts. |
| SQL Server runtime | Azure SQL Edge, SQL Server Developer Edition, or Docker SQL Server image | Host the local `TaskManagement` database. |
| OAuth/OIDC provider | Microsoft Entra ID, Google, or compatible provider | Issue JWT access tokens for frontend login and backend authorization. |
| Postman or Swagger UI | Current version | Test and inspect REST endpoints. |

Optional but recommended:

| Tool | Purpose |
| --- | --- |
| Docker Desktop | Run SQL Server locally without installing a full database server. |
| Azure CLI | Manage Azure resources and validate cloud configuration. |
| Azurite | Emulate Azure Storage for local Azure Functions development. |
| Visual Studio Code | Edit the frontend, backend, SQL scripts, and GitHub Actions workflow. |

Recommended VS Code extensions:

- C# Dev Kit
- Azure Functions
- Azure Account
- ESLint
- Prettier
- SQL Server

### Frontend

From the repository root:

```bash
cd client
pnpm install
pnpm run api:generate
pnpm run dev
```

Expected local URL:

```text
http://localhost:5173
```

Recommended frontend environment variables:

```bash
VITE_API_BASE_URL=http://localhost:7073/api
VITE_AUTH_AUTHORITY=https://login.microsoftonline.com/<tenant-id>/v2.0
VITE_AUTH_CLIENT_ID=<spa-client-id>
VITE_AUTH_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_AUTH_SCOPE=api://<api-client-id>/Tasks.Access
```

### Backend

From the repository root:

```bash
cd api
PATH=/usr/local/share/dotnet:$PATH dotnet restore
HOME=../.home PATH=/usr/local/share/dotnet:$PATH DOTNET_CLI_HOME=../.dotnet NUGET_PACKAGES=../.nuget/packages func start --dotnet-isolated --port 7073
```

Expected local API URL:

```text
http://localhost:7073/api
```

Recommended backend configuration:

```bash
AzureWebJobsStorage=UseDevelopmentStorage=true
SqlConnectionString=Server=localhost,1433;Database=TaskManagement;User Id=sa;Password=<password>;TrustServerCertificate=True;
Jwt__Authority=https://login.microsoftonline.com/<tenant-id>/v2.0
Jwt__Audience=api://<api-client-id>
Cors__AllowedOrigins=http://localhost:5173
```

### SQL Setup

Create the database and apply scripts from `sql/` in this order:

```bash
sqlcmd -S localhost,1433 -U sa -P '<password>' -Q "CREATE DATABASE TaskManagement"
sqlcmd -S localhost,1433 -U sa -P '<password>' -d TaskManagement -i sql/001_schema.sql
sqlcmd -S localhost,1433 -U sa -P '<password>' -d TaskManagement -i sql/002_stored_procedures.sql
```

The database should contain a `Tasks` table with indexes for ownership, assignee, status, due date, and text search columns used by server-side filtering.

## Authentication Setup

The preferred production setup is an OAuth2/OpenID Connect identity broker. Microsoft Entra External ID or Azure AD B2C keeps the architecture Azure-native while allowing Microsoft, Google, and GitHub login from one frontend/backend integration.

1. Create an app registration for the SPA client.
2. Create or expose an API app registration for the Azure Functions backend.
3. Configure Microsoft, Google, and GitHub as identity providers in the broker.
4. Add a delegated scope such as `Tasks.Access`.
5. Configure the SPA redirect URI as `http://localhost:5173/auth/callback` for local development.
6. Configure the API audience as `api://<api-client-id>`.
7. Validate JWT access tokens before allowing task operations.
8. Store the authenticated subject claim as `createdBy` when a task is created.
9. Store local app profile data through `/api/auth/register`; never store passwords in this API.

The frontend should request an access token before calling the API and send it as:

```http
Authorization: Bearer <access-token>
```

## API Documentation

The OpenAPI contract is stored at:

```text
docs/swagger.json
```

Import `docs/swagger.json` into Postman, Swagger Editor, or Azure API Management for interactive review.

Core REST endpoints:

```text
GET    /api/tasks
GET    /api/tasks/{id}
POST   /api/tasks
PUT    /api/tasks/{id}
PATCH  /api/tasks/{id}/status
DELETE /api/tasks/{id}
GET    /api/tasks/stream
```

Filtering and sorting should be server-side:

```text
GET /api/tasks?status=Pending&assignedTo=<user-id>&search=invoice&sortBy=dueDate&sortDirection=asc&page=1&pageSize=20
```

## Architecture Decisions

- Azure Functions keep the backend deployment lightweight while still supporting dependency injection, middleware, and clean request handlers.
- The backend separates function triggers, services, repositories, factories, and DTOs to keep HTTP, business rules, and SQL persistence independent.
- Application services return standardized `{ data, code, status, message }` envelopes and use a central error dictionary for known failures.
- Azure SQL stores tasks with stored procedures for predictable performance and reviewable data access.
- OAuth2/OpenID Connect keeps identity concerns outside the custom application code while still allowing JWT-based authorization in the API.
- React Router data routes provide route-level lazy loading.
- react-auth-kit owns frontend auth/session persistence behind the local `useAuth()` facade.
- Kubb generates React Query hooks from `docs/swagger.json`; task CRUD consumes generated hooks rather than manual API wrappers.
- Azure API Management exposes the public API facade in front of Azure Functions.
- Real-time status updates can start with Server-Sent Events from an HTTP-triggered function and later move to Azure SignalR Service if scale requires it.

See `docs/architecture.md` for the fuller design.

## Testing

Backend tests:

```bash
dotnet test tests/TaskManagement.Tests.csproj
```

Frontend tests:

```bash
cd client
pnpm run api:generate
pnpm test
pnpm run build
```

Recommended test coverage:

- Token validation and unauthorized request handling
- Task CRUD service rules
- Repository calls and stored procedure parameters
- Filtering and sorting query behavior
- Frontend form validation and API error states

## CI/CD

The CI workflow runs on pull requests and pushes to `main` or `develop`.

Backend CI:

```bash
dotnet restore TaskManagement.sln
dotnet test tests/TaskManagement.Tests.csproj --configuration Release --no-restore -- RunConfiguration.TreatNoTestsAsError=true
```

The `TreatNoTestsAsError` setting makes the job fail if test discovery returns zero tests.

Frontend CI installs pnpm with `pnpm/action-setup@v4` before enabling the pnpm cache in `actions/setup-node@v4`. It then runs:

```bash
cd client
pnpm install --frozen-lockfile
pnpm run api:generate
pnpm test
pnpm run build
```

The docs job validates `docs/swagger.json` with Python's JSON parser.

API deployment is implemented with:

```text
infra/main.bicep
.github/workflows/deploy-api.yml
docs/deployment.md
```

The deployment workflow uses GitHub OIDC to deploy Azure infrastructure with Bicep, publish the Azure Functions API, and apply Azure SQL scripts.

## Git Flow

Recommended branch model:

- `main`: production-ready releases
- `develop`: integration branch
- `feature/<name>`: feature work
- `release/<version>`: stabilization
- `hotfix/<name>`: urgent production fixes

## Improvements With More Time

- Add Azure SignalR Service for multi-instance real-time task updates.
- Add Azure API Management for rate limiting, API policies, and versioned external access.
- Add Bicep validation and IaC security scanning to CI.
- Add Azure Search for richer task search and filtering.
- Add Redis caching for high-read task-list views.
- Add audit history for task changes.
- Add E2E tests with Playwright.
- Add deployment environments for dev, staging, and production.
