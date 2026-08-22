namespace TaskManagement.Api.Auth;

/// <summary>
/// Normalized identity claims extracted from a validated external identity token.
/// </summary>
public sealed record AuthPrincipal(
    string ExternalId,
    string? Email,
    string? DisplayName,
    string Provider);
