namespace TaskManagement.Api.Dtos;

public sealed record TaskListResponse(
    IReadOnlyCollection<TaskResponse> Items,
    int Page,
    int PageSize);
