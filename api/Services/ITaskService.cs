using TaskManagement.Api.Dtos;

namespace TaskManagement.Api.Services;

public interface ITaskService
{
    Task<TaskResponse> CreateAsync(
        CreateTaskRequest request,
        string authenticatedUserId,
        CancellationToken cancellationToken);

    Task<TaskResponse?> GetByIdAsync(
        Guid id,
        string authenticatedUserId,
        CancellationToken cancellationToken);

    Task<TaskListResponse> ListAsync(
        TaskQuery query,
        string authenticatedUserId,
        CancellationToken cancellationToken);

    Task<TaskResponse?> UpdateAsync(
        Guid id,
        UpdateTaskRequest request,
        string authenticatedUserId,
        CancellationToken cancellationToken);

    Task<TaskResponse?> UpdateStatusAsync(
        Guid id,
        UpdateTaskStatusRequest request,
        string authenticatedUserId,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(
        Guid id,
        string authenticatedUserId,
        CancellationToken cancellationToken);
}
