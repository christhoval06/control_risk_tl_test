using TaskManagement.Api.Domain;

namespace TaskManagement.Api.Dtos;

public sealed record TaskResponse(
    Guid Id,
    string Title,
    string? Description,
    DateTime? DueDate,
    TaskItemStatus Status,
    string CreatedBy,
    string? AssignedTo,
    DateTime CreatedAt,
    DateTime UpdatedAt);
