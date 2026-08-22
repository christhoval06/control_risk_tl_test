using TaskManagement.Api.Domain;
using TaskManagement.Api.Dtos;

namespace TaskManagement.Api.Repositories;

public interface ITaskRepository
{
    Task<TaskItem> CreateAsync(TaskItem task, CancellationToken cancellationToken);

    Task<TaskItem?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<TaskItem>> ListAsync(
        string userId,
        TaskQuery query,
        CancellationToken cancellationToken);

    Task<TaskItem?> UpdateAsync(
        Guid id,
        string userId,
        UpdateTaskRequest request,
        CancellationToken cancellationToken);

    Task<TaskItem?> UpdateStatusAsync(
        Guid id,
        string userId,
        TaskItemStatus status,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(Guid id, string userId, CancellationToken cancellationToken);
}
