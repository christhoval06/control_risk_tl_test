using TaskManagement.Api.Domain;

namespace TaskManagement.Api.Factories;

public interface ITaskFactory
{
    TaskItem Create(
        string title,
        string? description,
        DateTime? dueDate,
        string createdBy,
        string? assignedTo);
}
