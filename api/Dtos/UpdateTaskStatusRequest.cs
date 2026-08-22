using TaskManagement.Api.Domain;

namespace TaskManagement.Api.Dtos;

public sealed record UpdateTaskStatusRequest(TaskItemStatus Status);
