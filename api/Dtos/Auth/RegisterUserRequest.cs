namespace TaskManagement.Api.Dtos.Auth;

public sealed record RegisterUserRequest(
    string DisplayName,
    string? Email);
