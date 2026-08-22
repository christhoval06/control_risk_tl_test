namespace TaskManagement.Api.Errors;

/// <summary>
/// Central dictionary for known application errors.
/// </summary>
public static class ErrorCatalog
{
    public static readonly ErrorDefinition AuthRequired = new(
        ServiceCodes.AuthRequired,
        "Authentication is required.");

    public static readonly ErrorDefinition InvalidRequestBody = new(
        ServiceCodes.InvalidRequestBody,
        "Invalid request body.");

    public static readonly ErrorDefinition TaskNotFound = new(
        ServiceCodes.TaskNotFound,
        "Task was not found.");

    public static readonly ErrorDefinition TaskTitleRequired = new(
        ServiceCodes.TaskTitleRequired,
        "Task title is required.");

    public static readonly ErrorDefinition ValidationError = new(
        ServiceCodes.ValidationError,
        "The request is invalid.");

    public static readonly ErrorDefinition UnexpectedError = new(
        ServiceCodes.UnexpectedError,
        "An unexpected error occurred.");

    public static IReadOnlyDictionary<string, ErrorDefinition> All { get; } =
        new Dictionary<string, ErrorDefinition>(StringComparer.OrdinalIgnoreCase)
        {
            [AuthRequired.Code] = AuthRequired,
            [InvalidRequestBody.Code] = InvalidRequestBody,
            [TaskNotFound.Code] = TaskNotFound,
            [TaskTitleRequired.Code] = TaskTitleRequired,
            [ValidationError.Code] = ValidationError,
            [UnexpectedError.Code] = UnexpectedError
        };
}
