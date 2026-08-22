namespace TaskManagement.Api.Domain;

/// <summary>
/// Local application profile linked to an external identity provider account.
/// </summary>
public sealed record UserProfile(
    Guid Id,
    string ExternalId,
    string? Email,
    string? DisplayName,
    string Provider,
    DateTime CreatedAt,
    DateTime UpdatedAt);
