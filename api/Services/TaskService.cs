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
    private readonly ITaskStatusEventPublisher _statusEventPublisher;
    private readonly ICacheService _cache;

    public TaskService(
        ITaskRepository repository,
        ITaskFactory taskFactory,
        ITaskStatusEventPublisher statusEventPublisher,
        ICacheService cache)
    {
        _repository = repository;
        _taskFactory = taskFactory;
        _statusEventPublisher = statusEventPublisher;
        _cache = cache;
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
        await InvalidateUserTaskListsAsync(authenticatedUserId, cancellationToken);

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

        var cacheKey = TaskItemCacheKey(authenticatedUserId, id);
        var cached = await _cache.GetAsync<TaskResponse>(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return ServiceResponse<TaskResponse>.Ok(
                cached,
                ServiceCodes.TaskRetrieved,
                "Task retrieved successfully.");
        }

        var task = await _repository.GetByIdAsync(id, authenticatedUserId, cancellationToken);

        if (task is null)
        {
            return ServiceResponse<TaskResponse>.Error(ErrorCatalog.TaskNotFound);
        }

        var response = Map(task);
        await _cache.SetAsync(cacheKey, response, cancellationToken);

        return ServiceResponse<TaskResponse>.Ok(
            response,
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
        var cacheKey = TaskListCacheKey(authenticatedUserId, normalizedQuery);
        var cached = await _cache.GetAsync<TaskListResponse>(cacheKey, cancellationToken);
        if (cached is not null)
        {
            return ServiceResponse<TaskListResponse>.Ok(
                cached,
                ServiceCodes.TasksListed,
                "Tasks listed successfully.");
        }

        var tasks = await _repository.ListAsync(authenticatedUserId, normalizedQuery, cancellationToken);
        var responses = tasks.Select(Map).ToArray();
        var listResponse = new TaskListResponse(responses, normalizedQuery.Page, normalizedQuery.PageSize);
        await _cache.SetAsync(cacheKey, listResponse, cancellationToken);

        return ServiceResponse<TaskListResponse>.Ok(
            listResponse,
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
        if (updated is not null)
        {
            await InvalidateUserTaskCacheAsync(authenticatedUserId, id, cancellationToken);
        }

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

        if (updated is null)
        {
            return ServiceResponse<TaskResponse>.Error(ErrorCatalog.TaskNotFound);
        }

        await InvalidateUserTaskCacheAsync(authenticatedUserId, id, cancellationToken);
        await _statusEventPublisher.PublishAsync(
            new TaskStatusEvent(updated.Id, updated.Status),
            cancellationToken);

        return ServiceResponse<TaskResponse>.Ok(
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
        if (deleted)
        {
            await InvalidateUserTaskCacheAsync(authenticatedUserId, id, cancellationToken);
        }

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

    private async Task InvalidateUserTaskCacheAsync(
        string authenticatedUserId,
        Guid taskId,
        CancellationToken cancellationToken)
    {
        await _cache.RemoveAsync(TaskItemCacheKey(authenticatedUserId, taskId), cancellationToken);
        await InvalidateUserTaskListsAsync(authenticatedUserId, cancellationToken);
    }

    private Task InvalidateUserTaskListsAsync(string authenticatedUserId, CancellationToken cancellationToken)
    {
        return _cache.RemoveByPrefixAsync(TaskListCachePrefix(authenticatedUserId), cancellationToken);
    }

    private static string TaskItemCacheKey(string authenticatedUserId, Guid taskId)
    {
        return $"tasks:item:{authenticatedUserId}:{taskId}";
    }

    private static string TaskListCachePrefix(string authenticatedUserId)
    {
        return $"tasks:list:{authenticatedUserId}:";
    }

    private static string TaskListCacheKey(string authenticatedUserId, TaskQuery query)
    {
        return string.Join(
            ':',
            TaskListCachePrefix(authenticatedUserId),
            query.Status ?? string.Empty,
            query.AssignedTo ?? string.Empty,
            query.Search ?? string.Empty,
            query.SortBy,
            query.SortDirection,
            query.Page,
            query.PageSize);
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
