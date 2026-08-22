namespace TaskManagement.Api.Dtos.Auth;

public sealed record AuthUserResponse(
    string ExternalId,
    string? Email,
    string? DisplayName,
    string Provider);
