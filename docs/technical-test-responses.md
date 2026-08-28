# Technical Test Responses

## Installation

Required tools:

- Git
- Node.js 20 LTS or newer
- pnpm 9.7.1 or newer
- .NET SDK 10.x
- Azure Functions Core Tools v4
- Docker Desktop
- Azure CLI
- Bicep CLI
- sqlcmd or Azure Data Studio

Install frontend dependencies:

```bash
cd client
pnpm install
pnpm run api:generate
```

Run the local stack with Docker:

```bash
docker compose up --build
```

Run the frontend:

```bash
cd client
pnpm run dev
```

Local URLs:

```text
Frontend: http://localhost:5173
API:      http://localhost:7071/api
SQL:      localhost:1433
Redis:    localhost:6379
```

For manual API execution:

```bash
cd api
dotnet restore
func start --dotnet-isolated --port 7073
```

## Project Explanation

This project is a full-stack task management application. Users authenticate through Microsoft Entra, which can broker Microsoft, Google, and GitHub identity providers. After login, the frontend calls the API with an access token.

The frontend uses React, TypeScript, Vite, Tailwind CSS, React Router data routes, react-hook-form, Zustand, react-auth-kit, and Kubb-generated React Query hooks. The generated hooks come from `docs/swagger.json`, so the UI consumes the documented API contract instead of maintaining hand-written API clients.

The backend uses C# Azure Functions isolated worker. Function classes handle HTTP concerns, services handle business workflows, repositories handle SQL access, and domain/factory classes keep task creation rules in one place. Azure SQL stores tasks and user profiles. Redis caches task-list responses for repeated reads.

The deployment target is Azure. Bicep defines the infrastructure, GitHub Actions deploys the application, Azure Functions runs the API, Azure SQL stores data, and Azure API Management exposes the public API facade.

## Architecture Decisions

The backend follows Clean Architecture boundaries in a lightweight way:

- Functions receive HTTP requests and return HTTP responses.
- Services enforce business rules and compose workflows.
- Repositories isolate persistence.
- DTOs define transport contracts.
- Domain objects represent application concepts.
- Factories centralize object creation.
- Error definitions live in a shared catalog.

This layout keeps SOLID principles practical:

- Single Responsibility: each layer has one reason to change.
- Open/Closed: new persistence or auth strategies can be added behind interfaces.
- Liskov Substitution: service code depends on contracts such as `ITaskRepository`.
- Interface Segregation: auth, tasks, cache, and status streaming use focused interfaces.
- Dependency Inversion: Functions depend on services, and services depend on abstractions.

The API returns a consistent response envelope:

```json
{
  "data": {},
  "code": "TASK_RETRIEVED",
  "status": "ok",
  "message": "Task retrieved successfully."
}
```

Known errors use the same shape:

```json
{
  "data": null,
  "code": "AUTH_REQUIRED",
  "status": "error",
  "message": "Authentication is required."
}
```

That makes frontend handling predictable and keeps error wording in one place.

## Real-Time Status Stream

The API exposes a Server-Sent Events endpoint for task status changes:

```text
GET /api/tasks/stream
```

The frontend opens the stream with `EventSource` and passes the access token through the query string:

```text
GET http://localhost:7071/api/tasks/stream?access_token=<jwt-token>
```

`EventSource` cannot send custom `Authorization` headers, so the backend supports the `access_token` query value only for this stream endpoint. The same JWT validation path still extracts and validates the user identity before opening the connection.

When a user updates a task status through `PATCH /api/tasks/{id}/status`, `TaskService` publishes a `TaskStatusEvent`. The stream returns events in this shape:

```text
event: task-status-updated
data: {"id":"f9b66f4f-92e5-4a99-9089-0e3e0fb593ad","status":"Done"}
```

The current implementation uses `InMemoryTaskStatusEventPublisher`, so it works for local development, Docker Compose, and a single API process. It does not support multi-instance fan-out because each Function App instance has its own memory. For production scale-out, I would replace the in-memory publisher with Azure SignalR Service, Azure Web PubSub, or Redis pub/sub.

Manual local test:

```bash
curl -N "http://localhost:7071/api/tasks/stream?access_token=$TOKEN"
```

Then update a task status from another terminal or from the UI. The curl session should receive a `task-status-updated` event.

## Trade-Offs: Architecture vs Alternatives

I chose one Azure Functions API project with multiple function endpoints. Internal separation lives in code through functions, services, repositories, DTOs, factories, interfaces, and dependency injection.

Alternative: deploy one Function App per service.

That model can help when bounded contexts have separate scaling, ownership, release cycles, or security requirements. For this technical test, it would add infrastructure, deployment complexity, API Management backend mappings, app settings, monitoring surfaces, and shared-code packaging without a matching benefit.

Alternative: expose Azure Functions directly.

Direct exposure works for small internal prototypes. I chose API Management because it gives the system a stable public facade and leaves room for JWT validation policies, throttling, API versioning, request transformation, and backend protection.

Alternative: build a manual frontend API client.

Manual clients are faster to start, but they drift from the backend contract. Kubb keeps hooks, types, and request functions generated from OpenAPI, which lowers integration mistakes.

Alternative: store auth state only in a custom Zustand store.

Zustand works well for UI state, but auth has different needs: token persistence, sign-in, sign-out, and session lifecycle. react-auth-kit owns that concern, while Zustand remains focused on task UI state.

## Why Stored Procedures

Stored procedures were used for data access because this test benefits from explicit, reviewable database contracts.

Main reasons:

- They keep SQL behavior close to the database.
- They provide parameterized execution and reduce ad hoc query construction.
- They make CRUD operations easy to inspect during review.
- They centralize ownership rules such as `CreatedBy` and `AssignedTo` filtering.
- They allow index tuning around known access patterns.
- They let the API repository stay thin and focused.

The trade-off is that stored procedures add database migration discipline. Application code and SQL scripts must evolve together. For a larger product, I would add a formal migration tool and automated database deployment checks.

## Architecture Decisions and Patterns Used

Patterns and practices used:

- Clean separation of concerns across Functions, Services, Repositories, Domain, DTOs, Errors, and Factories.
- Repository Pattern for SQL access.
- Factory Pattern for task creation defaults.
- Dependency Injection for service composition.
- Service Response Pattern for consistent API responses.
- Error Catalog for shared error codes and messages.
- OpenAPI-first client generation with Kubb.
- React Router data routes with lazy-loaded pages.
- react-hook-form for form state and validation ergonomics.
- react-auth-kit for auth session management.
- Zustand for focused UI/query state.
- Redis cache abstraction with a null-cache fallback.
- Server-Sent Events for task status updates.
- Bicep for infrastructure as code.
- GitHub Actions with Azure OIDC for CI/CD.
- xUnit and Moq for backend unit tests.

## What I Would Improve With More Time

I would add database migrations with a tool such as DbUp, Flyway, or Liquibase so schema and stored procedure changes can run with version tracking.

I would improve observability with structured logs, request correlation IDs, Application Insights dashboards, SQL timing logs, and cache hit/miss metrics. That would make latency issues easier to diagnose.

I would strengthen security by moving SQL secrets to Azure Key Vault, using managed identity where possible, validating JWTs at API Management, and restricting direct Function App access.

I would add more tests around authorization edge cases, stored procedure behavior, frontend route guards, generated API hook usage, and full login-to-task flows.

I would tune SQL performance with execution-plan review, query-specific indexes, pagination tests with larger datasets, and separate read models if task-list traffic grows.

I would improve real-time updates by evaluating Azure SignalR Service if the application needs multi-instance fan-out, reconnect history, or richer collaboration events.

I would add a production frontend hosting target, such as Azure Static Web Apps or Azure Storage static website hosting behind CDN, then wire that endpoint into CORS and Entra redirect URIs.
