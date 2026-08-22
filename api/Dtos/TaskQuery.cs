namespace TaskManagement.Api.Dtos;

public sealed record TaskQuery(
    string? Status,
    string? AssignedTo,
    string? Search,
    string SortBy = "dueDate",
    string SortDirection = "asc",
    int Page = 1,
    int PageSize = 20);
