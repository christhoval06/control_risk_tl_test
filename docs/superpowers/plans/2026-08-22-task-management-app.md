# Task Management App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Azure-integrated task management web application required by the senior software engineer technical test.

**Architecture:** A React + TypeScript SPA calls a C# Azure Functions REST API secured by OAuth2/OpenID Connect JWTs. The API uses dependency injection, services, repositories, a task factory, and Azure SQL stored procedures to keep concerns separated and testable.

**Tech Stack:** React, TypeScript, Bootstrap, Axios, C# .NET isolated Azure Functions targeting `net10.0` in this workspace, Azure SQL, xUnit, Moq, Swagger/OpenAPI, GitHub Actions.

**Spec:** `/Users/alfamedic/Documents/Senior Software Engineer - Technical Test.pdf`

## Global Constraints

- Frontend must use React + TypeScript + Bootstrap or Tailwind.
- Backend must use Azure Functions in C#.
- Database must use Azure SQL Server.
- Authentication must use OAuth2 or OpenID Connect, such as Microsoft Identity Platform.
- API must be RESTful and documented with Swagger.
- Backend must apply dependency injection, Repository Pattern, and Factory Pattern.
- Unit tests must use xUnit and Moq.
- Repository structure must keep `/client`, `/api`, `/sql`, `/docs`, `/tests`, and `.github/workflows`.
- Task fields are `title`, `description`, `dueDate`, `status`, `createdBy`, and `assignedTo`.
- Allowed task statuses are `Pending`, `In Progress`, and `Done`.

---

## File Structure

- Create `sql/001_schema.sql`: task table, constraints, and indexes.
- Create `sql/002_stored_procedures.sql`: CRUD and list stored procedures.
- Create `api/TaskManagement.Api.csproj`: Azure Functions project definition.
- Create `api/Program.cs`: dependency injection and configuration.
- Create `api/Domain/TaskItem.cs`: task domain model.
- Create `api/Domain/TaskStatus.cs`: allowed statuses.
- Create `api/Dtos/*.cs`: request, response, and query contracts.
- Create `api/Factories/TaskFactory.cs`: valid task construction.
- Create `api/Repositories/SqlTaskRepository.cs`: SQL stored procedure access.
- Create `api/Services/TaskService.cs`: task business rules.
- Create `api/Functions/Tasks/*.cs`: HTTP-triggered Azure Functions.
- Create `tests/TaskManagement.Tests.csproj`: xUnit test project.
- Create `tests/TaskServiceTests.cs`: service behavior tests.
- Create `tests/TaskFactoryTests.cs`: factory validation tests.
- Create `client/package.json`: frontend project scripts and dependencies.
- Create `client/src/*`: React application, auth provider, task API, hooks, and components.
- Modify `docs/swagger.json`: OpenAPI contract for task endpoints.
- Modify `.github/workflows/ci.yml`: build and test workflow.

### Task 1: Database Schema and Stored Procedures

**Files:**
- Create: `sql/001_schema.sql`
- Create: `sql/002_stored_procedures.sql`

**Interfaces:**
- Produces: `dbo.Tasks` table with columns used by API DTOs.
- Produces: stored procedures `dbo.Task_Create`, `dbo.Task_GetById`, `dbo.Task_List`, `dbo.Task_Update`, `dbo.Task_UpdateStatus`, and `dbo.Task_Delete`.

- [ ] **Step 1: Create the schema script**

```sql
CREATE TABLE dbo.Tasks
(
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Tasks PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(2000) NULL,
    DueDate DATETIME2 NULL,
    Status NVARCHAR(20) NOT NULL,
    CreatedBy NVARCHAR(200) NOT NULL,
    AssignedTo NVARCHAR(200) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Tasks_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Tasks_UpdatedAt DEFAULT SYSUTCDATETIME(),
    RowVersion ROWVERSION NOT NULL,
    CONSTRAINT CK_Tasks_Status CHECK (Status IN ('Pending', 'In Progress', 'Done'))
);

CREATE INDEX IX_Tasks_CreatedBy_Status_DueDate ON dbo.Tasks (CreatedBy, Status, DueDate);
CREATE INDEX IX_Tasks_AssignedTo_Status_DueDate ON dbo.Tasks (AssignedTo, Status, DueDate);
CREATE INDEX IX_Tasks_Status_DueDate ON dbo.Tasks (Status, DueDate);
```

- [ ] **Step 2: Create the create-task stored procedure**

```sql
CREATE OR ALTER PROCEDURE dbo.Task_Create
    @Id UNIQUEIDENTIFIER,
    @Title NVARCHAR(200),
    @Description NVARCHAR(2000),
    @DueDate DATETIME2,
    @Status NVARCHAR(20),
    @CreatedBy NVARCHAR(200),
    @AssignedTo NVARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Tasks (Id, Title, Description, DueDate, Status, CreatedBy, AssignedTo, CreatedAt, UpdatedAt)
    VALUES (@Id, @Title, @Description, @DueDate, @Status, @CreatedBy, @AssignedTo, SYSUTCDATETIME(), SYSUTCDATETIME());

    SELECT Id, Title, Description, DueDate, Status, CreatedBy, AssignedTo, CreatedAt, UpdatedAt
    FROM dbo.Tasks
    WHERE Id = @Id;
END;
```

- [ ] **Step 3: Create the list-task stored procedure**

```sql
CREATE OR ALTER PROCEDURE dbo.Task_List
    @UserId NVARCHAR(200),
    @Status NVARCHAR(20) = NULL,
    @AssignedTo NVARCHAR(200) = NULL,
    @Search NVARCHAR(200) = NULL,
    @SortBy NVARCHAR(30) = 'dueDate',
    @SortDirection NVARCHAR(4) = 'asc',
    @Page INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@Page - 1) * @PageSize;

    SELECT Id, Title, Description, DueDate, Status, CreatedBy, AssignedTo, CreatedAt, UpdatedAt
    FROM dbo.Tasks
    WHERE (CreatedBy = @UserId OR AssignedTo = @UserId)
      AND (@Status IS NULL OR Status = @Status)
      AND (@AssignedTo IS NULL OR AssignedTo = @AssignedTo)
      AND (@Search IS NULL OR Title LIKE '%' + @Search + '%' OR Description LIKE '%' + @Search + '%')
    ORDER BY
      CASE WHEN @SortBy = 'dueDate' AND @SortDirection = 'asc' THEN DueDate END ASC,
      CASE WHEN @SortBy = 'dueDate' AND @SortDirection = 'desc' THEN DueDate END DESC,
      CASE WHEN @SortBy = 'status' AND @SortDirection = 'asc' THEN Status END ASC,
      CASE WHEN @SortBy = 'status' AND @SortDirection = 'desc' THEN Status END DESC,
      CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END;
```

- [ ] **Step 4: Add get, update, status, and delete procedures**

Use parameterized stored procedures with the same ownership rule:

```sql
WHERE Id = @Id AND (CreatedBy = @UserId OR AssignedTo = @UserId)
```

Use `CreatedBy = @UserId` for delete permissions.

- [ ] **Step 5: Verify scripts locally**

Run:

```bash
sqlcmd -S localhost,1433 -U sa -P '<password>' -Q "CREATE DATABASE TaskManagement"
sqlcmd -S localhost,1433 -U sa -P '<password>' -d TaskManagement -i sql/001_schema.sql
sqlcmd -S localhost,1433 -U sa -P '<password>' -d TaskManagement -i sql/002_stored_procedures.sql
```

Expected: both SQL scripts complete without syntax errors.

### Task 2: Backend Domain, DTOs, Factory, and Service

**Files:**
- Create: `api/TaskManagement.Api.csproj`
- Create: `api/Program.cs`
- Create: `api/Domain/TaskItem.cs`
- Create: `api/Domain/TaskStatus.cs`
- Create: `api/Dtos/CreateTaskRequest.cs`
- Create: `api/Dtos/UpdateTaskRequest.cs`
- Create: `api/Dtos/UpdateTaskStatusRequest.cs`
- Create: `api/Dtos/TaskQuery.cs`
- Create: `api/Dtos/TaskResponse.cs`
- Create: `api/Factories/ITaskFactory.cs`
- Create: `api/Factories/TaskFactory.cs`
- Create: `api/Services/ITaskService.cs`
- Create: `api/Services/TaskService.cs`

**Interfaces:**
- Consumes: `dbo.Task_*` stored procedure contract from Task 1.
- Produces: `ITaskService` methods `CreateAsync`, `GetByIdAsync`, `ListAsync`, `UpdateAsync`, `UpdateStatusAsync`, and `DeleteAsync`.

- [ ] **Step 1: Create failing factory tests**

```csharp
[Fact]
public void Create_DefaultsStatusToPendingAndSetsOwner()
{
    var factory = new TaskFactory();
    var task = factory.Create("Pay invoice", null, null, "user-1", "user-2");

    Assert.Equal("Pay invoice", task.Title);
    Assert.Equal(TaskItemStatus.Pending, task.Status);
    Assert.Equal("user-1", task.CreatedBy);
    Assert.Equal("user-2", task.AssignedTo);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
dotnet test tests
```

Expected: FAIL because `TaskFactory` does not exist.

- [ ] **Step 3: Implement the domain model and factory**

```csharp
public enum TaskItemStatus
{
    Pending,
    InProgress,
    Done
}

public sealed record TaskItem(
    Guid Id,
    string Title,
    string? Description,
    DateTime? DueDate,
    TaskItemStatus Status,
    string CreatedBy,
    string? AssignedTo,
    DateTime CreatedAt,
    DateTime UpdatedAt);
```

```csharp
public sealed class TaskFactory : ITaskFactory
{
    public TaskItem Create(string title, string? description, DateTime? dueDate, string createdBy, string? assignedTo)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new ArgumentException("Title is required.", nameof(title));
        if (string.IsNullOrWhiteSpace(createdBy)) throw new ArgumentException("CreatedBy is required.", nameof(createdBy));

        var now = DateTime.UtcNow;
        return new TaskItem(Guid.NewGuid(), title.Trim(), description, dueDate, TaskItemStatus.Pending, createdBy, assignedTo, now, now);
    }
}
```

- [ ] **Step 4: Create service tests for create and status update**

```csharp
[Fact]
public async Task CreateAsync_CallsRepositoryWithAuthenticatedUser()
{
    var repository = new Mock<ITaskRepository>();
    var factory = new TaskFactory();
    var expected = factory.Create("Pay invoice", null, null, "user-1", "user-2");
    repository.Setup(r => r.CreateAsync(It.IsAny<TaskItem>(), It.IsAny<CancellationToken>()))
        .ReturnsAsync(expected);

    var service = new TaskService(repository.Object, factory);
    var result = await service.CreateAsync(new CreateTaskRequest("Pay invoice", null, null, "user-2"), "user-1", CancellationToken.None);

    Assert.Equal("Pay invoice", result.Title);
    repository.Verify(r => r.CreateAsync(It.Is<TaskItem>(t => t.CreatedBy == "user-1"), It.IsAny<CancellationToken>()), Times.Once);
}
```

- [ ] **Step 5: Implement `TaskService`**

`TaskService` validates input, delegates persistence to `ITaskRepository`, and maps domain models to `TaskResponse`.

- [ ] **Step 6: Run backend tests**

Run:

```bash
dotnet test tests
```

Expected: PASS.

### Task 3: SQL Repository and Azure Functions Endpoints

**Files:**
- Create: `api/Repositories/ITaskRepository.cs`
- Create: `api/Repositories/SqlTaskRepository.cs`
- Create: `api/Functions/Tasks/CreateTaskFunction.cs`
- Create: `api/Functions/Tasks/GetTaskByIdFunction.cs`
- Create: `api/Functions/Tasks/ListTasksFunction.cs`
- Create: `api/Functions/Tasks/UpdateTaskFunction.cs`
- Create: `api/Functions/Tasks/UpdateTaskStatusFunction.cs`
- Create: `api/Functions/Tasks/DeleteTaskFunction.cs`

**Interfaces:**
- Consumes: `ITaskService` from Task 2.
- Produces: REST API endpoints documented in `docs/swagger.json`.

- [ ] **Step 1: Create function tests for unauthorized create**

```csharp
[Fact]
public async Task Create_ReturnsUnauthorized_WhenUserIsMissing()
{
    var service = new Mock<ITaskService>();
    var principalReader = new Mock<IJwtPrincipalReader>();
    principalReader.Setup(r => r.GetUserId(It.IsAny<HttpRequestData>())).Returns((string?)null);

    var function = new CreateTaskFunction(service.Object, principalReader.Object);
    var response = await function.Run(CreateRequest("{}"), CancellationToken.None);

    Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
dotnet test tests --filter Create_ReturnsUnauthorized
```

Expected: FAIL because the function class does not exist.

- [ ] **Step 3: Implement repository methods**

Use `SqlConnection`, `SqlCommand`, `CommandType.StoredProcedure`, and parameters for all calls:

```csharp
await using var connection = new SqlConnection(_connectionString);
await using var command = new SqlCommand("dbo.Task_Create", connection)
{
    CommandType = CommandType.StoredProcedure
};
command.Parameters.AddWithValue("@Id", task.Id);
command.Parameters.AddWithValue("@Title", task.Title);
```

- [ ] **Step 4: Implement function classes**

Each function validates authentication, deserializes JSON, calls `ITaskService`, and returns the correct HTTP status.

- [ ] **Step 5: Run API locally**

Run:

```bash
cd api
func start
```

Expected: Functions host starts on `http://localhost:7073` when port `7071` is already in use.

### Task 4: Swagger/OpenAPI Contract

**Files:**
- Modify: `docs/swagger.json`

**Interfaces:**
- Consumes: endpoint routes from Task 3.
- Produces: OpenAPI 3.0 document for local review and Postman import.

- [ ] **Step 1: Define OpenAPI metadata and bearer auth**

```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "Task Management API",
    "version": "1.0.0"
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}
```

- [ ] **Step 2: Add task schemas**

Add `TaskResponse`, `CreateTaskRequest`, `UpdateTaskRequest`, `UpdateTaskStatusRequest`, `ProblemDetails`, and paged list response schemas.

- [ ] **Step 3: Add endpoint paths**

Document `GET /tasks`, `GET /tasks/{id}`, `POST /tasks`, `PUT /tasks/{id}`, `PATCH /tasks/{id}/status`, and `DELETE /tasks/{id}`.

- [ ] **Step 4: Validate the JSON**

Run:

```bash
python3 -m json.tool docs/swagger.json >/tmp/task-management-swagger.json
```

Expected: command exits with status 0.

### Task 5: React Frontend

**Files:**
- Create: `client/package.json`
- Create: `client/src/main.tsx`
- Create: `client/src/app/App.tsx`
- Create: `client/src/auth/AuthProvider.tsx`
- Create: `client/src/tasks/api.ts`
- Create: `client/src/tasks/hooks/useTasks.ts`
- Create: `client/src/tasks/hooks/useTaskStatusStream.ts`
- Create: `client/src/tasks/components/TaskForm.tsx`
- Create: `client/src/tasks/components/TaskFilters.tsx`
- Create: `client/src/tasks/components/TaskList.tsx`
- Create: `client/src/tasks/types.ts`

**Interfaces:**
- Consumes: REST API from Task 3 and OpenAPI contract from Task 4.
- Produces: responsive authenticated task management UI.

- [ ] **Step 1: Scaffold the React app**

Run:

```bash
cd client
pnpm create vite@latest . -- --template react-ts
pnpm add axios react-hook-form zustand
pnpm add -D tailwindcss @tailwindcss/postcss postcss autoprefixer kubb @kubb/plugin-ts @kubb/plugin-axios
```

- [ ] **Step 2: Create task types**

```ts
export type TaskStatus = 'Pending' | 'In Progress' | 'Done';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: TaskStatus;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 3: Create the API client**

```ts
export async function listTasks(token: string, query: TaskQuery): Promise<TaskItem[]> {
  const response = await axios.get<TaskItem[]>(`${import.meta.env.VITE_API_BASE_URL}/tasks`, {
    params: query,
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}
```

- [ ] **Step 4: Build task form validation**

`TaskForm` must require `title`, allow optional `description`, `dueDate`, and `assignedTo`, and disable submit while saving.

- [ ] **Step 5: Build filtering and sorting controls**

`TaskFilters` must send `status`, `assignedTo`, `search`, `sortBy`, and `sortDirection` into `useTasks`.

- [ ] **Step 6: Build real-time status updates**

`useTaskStatusStream` opens an `EventSource` for `/tasks/stream` and merges incoming task-status events into current task state.

- [ ] **Step 7: Run frontend checks**

Run:

```bash
cd client
pnpm run build
```

Expected: production build completes.

### Task 6: Authentication Integration

**Files:**
- Create: `client/src/auth/authClient.ts`
- Modify: `client/src/auth/AuthProvider.tsx`
- Create: `api/Auth/JwtOptions.cs`
- Create: `api/Auth/JwtPrincipalReader.cs`
- Modify: `api/Program.cs`

**Interfaces:**
- Consumes: OAuth2/OpenID Connect provider configuration.
- Produces: authenticated frontend session and backend user ID extraction.

- [ ] **Step 1: Configure frontend auth client**

Use Microsoft Authentication Library for Entra ID:

```bash
cd client
pnpm add @azure/msal-browser @azure/msal-react
```

- [ ] **Step 2: Add login and token acquisition**

`AuthProvider` should expose `login`, `logout`, `account`, and `getAccessToken`.

- [ ] **Step 3: Validate JWTs in the API**

Configure issuer, audience, signing keys, expiration, and scope validation.

- [ ] **Step 4: Protect every task endpoint**

Each task function must return `401 Unauthorized` when the bearer token is missing or invalid.

- [ ] **Step 5: Verify auth behavior**

Run:

```bash
curl -i http://localhost:7073/api/tasks
```

Expected: `401 Unauthorized`.

### Task 7: CI Workflow

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: backend, frontend, tests, and SQL files from previous tasks.
- Produces: GitHub Actions workflow that validates the project on pull requests.

- [ ] **Step 1: Add workflow triggers**

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main, develop]
```

- [ ] **Step 2: Add backend job**

```yaml
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: dotnet restore api
      - run: dotnet build api --configuration Release --no-restore
      - run: dotnet test tests --configuration Release --no-build
```

- [ ] **Step 3: Add frontend job**

```yaml
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
          cache-dependency-path: client/pnpm-lock.yaml
      - run: pnpm install --frozen-lockfile
        working-directory: client
      - run: pnpm run build
        working-directory: client
```

- [ ] **Step 4: Validate workflow syntax**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
assert Path('.github/workflows/ci.yml').read_text().strip()
PY
```

Expected: command exits with status 0.

### Task 8: Final Verification and Documentation Review

**Files:**
- Modify: `docs/README.md`
- Modify: `docs/architecture.md`
- Modify: `docs/swagger.json`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: final documentation aligned with the implemented behavior.

- [ ] **Step 1: Run backend tests**

```bash
dotnet test tests
```

Expected: PASS.

- [ ] **Step 2: Run frontend build**

```bash
cd client
pnpm run build
```

Expected: PASS.

- [ ] **Step 3: Validate Swagger JSON**

```bash
python3 -m json.tool docs/swagger.json >/tmp/task-management-swagger.json
```

Expected: PASS.

- [ ] **Step 4: Review README run instructions**

Confirm that local commands, environment variables, auth setup, Swagger URL, architecture notes, and improvement list match the implemented code.

- [ ] **Step 5: Commit the finished implementation**

```bash
git add api client sql tests docs .github/workflows
git commit -m "feat: implement task management technical test"
```

## Self-Review

- Spec coverage: The plan covers user auth, task CRUD, filtering, sorting, Azure SQL schema, stored procedures, Azure Functions, DI, Repository Pattern, Factory Pattern, React TypeScript frontend, responsive UX, Swagger, tests, and CI/CD-ready structure.
- Completeness scan: The plan uses concrete file paths, commands, and interfaces for implementation handoff.
- Type consistency: Task status values, DTO names, service method names, and stored procedure names are consistent across backend, frontend, SQL, and docs.
