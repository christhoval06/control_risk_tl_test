namespace TaskManagement.Api.Errors;

/// <summary>
/// Describes a stable application error that can be reused by services and HTTP functions.
/// </summary>
public sealed record ErrorDefinition(string Code, string Message);
