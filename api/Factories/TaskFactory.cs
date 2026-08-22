using TaskManagement.Api.Domain;

namespace TaskManagement.Api.Factories;

public sealed class TaskFactory : ITaskFactory
{
    public TaskItem Create(
        string title,
        string? description,
        DateTime? dueDate,
        string createdBy,
        string? assignedTo)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Title is required.", nameof(title));
        }

        if (string.IsNullOrWhiteSpace(createdBy))
        {
            throw new ArgumentException("CreatedBy is required.", nameof(createdBy));
        }

        var now = DateTime.UtcNow;

        return new TaskItem(
            Guid.NewGuid(),
            title.Trim(),
            description,
            dueDate,
            TaskItemStatus.Pending,
            createdBy,
            string.IsNullOrWhiteSpace(assignedTo) ? null : assignedTo,
            now,
            now);
    }
}
