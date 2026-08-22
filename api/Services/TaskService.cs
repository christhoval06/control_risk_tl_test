using TaskManagement.Api.Domain;
using TaskManagement.Api.Dtos;
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

    public async Task<TaskResponse> CreateAsync(
        CreateTaskRequest request,
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        EnsureAuthenticatedUser(authenticatedUserId);

        var task = _taskFactory.Create(
            request.Title,
            request.Description,
            request.DueDate,
            authenticatedUserId,
            request.AssignedTo);

        var created = await _repository.CreateAsync(task, cancellationToken);

        return Map(created);
    }

    public async Task<TaskResponse?> GetByIdAsync(
        Guid id,
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        EnsureAuthenticatedUser(authenticatedUserId);

        var task = await _repository.GetByIdAsync(id, authenticatedUserId, cancellationToken);

        return task is null ? null : Map(task);
    }

    public async Task<TaskListResponse> ListAsync(
        TaskQuery query,
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        EnsureAuthenticatedUser(authenticatedUserId);

        var normalizedQuery = Normalize(query);
        var tasks = await _repository.ListAsync(authenticatedUserId, normalizedQuery, cancellationToken);
        var responses = tasks.Select(Map).ToArray();

        return new TaskListResponse(responses, normalizedQuery.Page, normalizedQuery.PageSize);
    }

    public async Task<TaskResponse?> UpdateAsync(
        Guid id,
        UpdateTaskRequest request,
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        EnsureAuthenticatedUser(authenticatedUserId);

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ArgumentException("Title is required.", nameof(request));
        }

        var updated = await _repository.UpdateAsync(id, authenticatedUserId, request, cancellationToken);

        return updated is null ? null : Map(updated);
    }

    public async Task<TaskResponse?> UpdateStatusAsync(
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

        return updated is null ? null : Map(updated);
    }

    public Task<bool> DeleteAsync(
        Guid id,
        string authenticatedUserId,
        CancellationToken cancellationToken)
    {
        EnsureAuthenticatedUser(authenticatedUserId);

        return _repository.DeleteAsync(id, authenticatedUserId, cancellationToken);
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
