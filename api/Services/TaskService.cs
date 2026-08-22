using TaskManagement.Api.Domain;
using TaskManagement.Api.Dtos;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Factories;
using TaskManagement.Api.Repositories;

namespace TaskManagement.Api.Services;

public sealed class TaskService : ITaskService
{
    private static readonly HashSet<string> AllowedSortFields = new(StringComparer.OrdinalIgnoreCase)
    {
        "dueDate",
        "status",
        "createdAt"
    };

    private readonly ITaskRepository _repository;
    private readonly ITaskFactory _taskFactory;

    public TaskService(ITaskRepository repository, ITaskFactory taskFactory)
    {
        _repository = repository;
        _taskFactory = taskFactory;
    }

    /// <summary>
    /// Creates a task owned by the authenticated user.
    /// </summary>
    public async Task<ServiceResponse<TaskResponse>> CreateAsync(
        CreateTaskRequest request,
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        EnsureAuthenticatedUser(authenticatedUserId);

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return ServiceResponse<TaskResponse>.Error(ErrorCatalog.TaskTitleRequired);
        }

        var task = _taskFactory.Create(
            request.Title,
            request.Description,
            request.DueDate,
            authenticatedUserId,
            request.AssignedTo);

        var created = await _repository.CreateAsync(task, cancellationToken);

        return ServiceResponse<TaskResponse>.Ok(
            Map(created),
            ServiceCodes.TaskCreated,
            "Task created successfully.");
    }

    /// <summary>
    /// Retrieves one task scoped to the authenticated user.
    /// </summary>
    public async Task<ServiceResponse<TaskResponse>> GetByIdAsync(
        Guid id,
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        EnsureAuthenticatedUser(authenticatedUserId);

        var task = await _repository.GetByIdAsync(id, authenticatedUserId, cancellationToken);

        return task is null
            ? ServiceResponse<TaskResponse>.Error(ErrorCatalog.TaskNotFound)
            : ServiceResponse<TaskResponse>.Ok(
                Map(task),
                ServiceCodes.TaskRetrieved,
                "Task retrieved successfully.");
    }

    /// <summary>
    /// Lists tasks for the authenticated user using normalized server-side filters.
    /// </summary>
    public async Task<ServiceResponse<TaskListResponse>> ListAsync(
        TaskQuery query,
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        EnsureAuthenticatedUser(authenticatedUserId);

        var normalizedQuery = Normalize(query);
        var tasks = await _repository.ListAsync(authenticatedUserId, normalizedQuery, cancellationToken);
        var responses = tasks.Select(Map).ToArray();

        return ServiceResponse<TaskListResponse>.Ok(
            new TaskListResponse(responses, normalizedQuery.Page, normalizedQuery.PageSize),
            ServiceCodes.TasksListed,
            "Tasks listed successfully.");
    }

    /// <summary>
    /// Updates a task when it exists for the authenticated user.
    /// </summary>
    public async Task<ServiceResponse<TaskResponse>> UpdateAsync(
        Guid id,
        UpdateTaskRequest request,
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        EnsureAuthenticatedUser(authenticatedUserId);

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return ServiceResponse<TaskResponse>.Error(ErrorCatalog.TaskTitleRequired);
        }

        var updated = await _repository.UpdateAsync(id, authenticatedUserId, request, cancellationToken);

        return updated is null
            ? ServiceResponse<TaskResponse>.Error(ErrorCatalog.TaskNotFound)
            : ServiceResponse<TaskResponse>.Ok(
                Map(updated),
                ServiceCodes.TaskUpdated,
                "Task updated successfully.");
    }

    /// <summary>
    /// Updates only the workflow status for an existing task.
    /// </summary>
    public async Task<ServiceResponse<TaskResponse>> UpdateStatusAsync(
        Guid id,
        UpdateTaskStatusRequest request,
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        EnsureAuthenticatedUser(authenticatedUserId);

        var updated = await _repository.UpdateStatusAsync(
            id,
            authenticatedUserId,
            request.Status,
            cancellationToken);

        return updated is null
            ? ServiceResponse<TaskResponse>.Error(ErrorCatalog.TaskNotFound)
            : ServiceResponse<TaskResponse>.Ok(
                Map(updated),
                ServiceCodes.TaskStatusUpdated,
                "Task status updated successfully.");
    }

    /// <summary>
    /// Deletes a task when it exists for the authenticated user.
    /// </summary>
    public async Task<ServiceResponse<object?>> DeleteAsync(
        Guid id,
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        EnsureAuthenticatedUser(authenticatedUserId);

        var deleted = await _repository.DeleteAsync(id, authenticatedUserId, cancellationToken);

        return deleted
            ? ServiceResponse<object?>.Ok(null, ServiceCodes.TaskDeleted, "Task deleted successfully.")
            : ServiceResponse<object?>.Error(ErrorCatalog.TaskNotFound);
    }

    private static TaskQuery Normalize(TaskQuery query)
    {
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var sortBy = AllowedSortFields.Contains(query.SortBy) ? query.SortBy : "dueDate";
        var sortDirection = string.Equals(query.SortDirection, "desc", StringComparison.OrdinalIgnoreCase)
            ? "desc"
            : "asc";

        return query with
        {
            Page = page,
            PageSize = pageSize,
            SortBy = sortBy,
            SortDirection = sortDirection
        };
    }

    private static void EnsureAuthenticatedUser(string authenticatedUserId)
    {
        if (string.IsNullOrWhiteSpace(authenticatedUserId))
        {
            throw new UnauthorizedAccessException("An authenticated user is required.");
        }
    }

    private static TaskResponse Map(TaskItem task)
    {
        return new TaskResponse(
            task.Id,
            task.Title,
            task.Description,
            task.DueDate,
            task.Status,
            task.CreatedBy,
            task.AssignedTo,
            task.CreatedAt,
            task.UpdatedAt);
    }
}
