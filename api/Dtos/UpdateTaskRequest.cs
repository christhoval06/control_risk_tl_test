using TaskManagement.Api.Domain;

namespace TaskManagement.Api.Dtos;

public sealed record UpdateTaskRequest(
    string Title,
    string? Description,
    DateTime? DueDate,
    TaskItemStatus Status,
    string? AssignedTo);
