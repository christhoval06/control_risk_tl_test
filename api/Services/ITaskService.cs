using TaskManagement.Api.Dtos;

namespace TaskManagement.Api.Services;

public interface ITaskService
{
    Task<ServiceResponse<TaskResponse>> CreateAsync(
        CreateTaskRequest request,
        string authenticatedUserId,
        CancellationToken cancellationToken);

    Task<ServiceResponse<TaskResponse>> GetByIdAsync(
        Guid id,
        string authenticatedUserId,
        CancellationToken cancellationToken);

    Task<ServiceResponse<TaskListResponse>> ListAsync(
        TaskQuery query,
        string authenticatedUserId,
        CancellationToken cancellationToken);

    Task<ServiceResponse<TaskResponse>> UpdateAsync(
        Guid id,
        UpdateTaskRequest request,
        string authenticatedUserId,
        CancellationToken cancellationToken);

    Task<ServiceResponse<TaskResponse>> UpdateStatusAsync(
        Guid id,
        UpdateTaskStatusRequest request,
        string authenticatedUserId,
        CancellationToken cancellationToken);

    Task<ServiceResponse<object?>> DeleteAsync(
        Guid id,
        string authenticatedUserId,
        CancellationToken cancellationToken);
}
