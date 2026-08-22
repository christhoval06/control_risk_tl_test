namespace TaskManagement.Api.Domain;

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
