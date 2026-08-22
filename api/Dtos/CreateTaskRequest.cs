namespace TaskManagement.Api.Dtos;

public sealed record CreateTaskRequest(
    string Title,
    string? Description,
    DateTime? DueDate,
    string? AssignedTo);
