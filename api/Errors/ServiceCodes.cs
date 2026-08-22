namespace TaskManagement.Api.Errors;

/// <summary>
/// Stable response codes used by service results and API envelopes.
/// </summary>
public static class ServiceCodes
{
    public const string TaskCreated = "TASK_CREATED";
    public const string TaskRetrieved = "TASK_RETRIEVED";
    public const string TasksListed = "TASKS_LISTED";
    public const string TaskUpdated = "TASK_UPDATED";
    public const string TaskStatusUpdated = "TASK_STATUS_UPDATED";
    public const string TaskDeleted = "TASK_DELETED";

    public const string AuthLoginOk = "AUTH_LOGIN_OK";
    public const string AuthLogoutOk = "AUTH_LOGOUT_OK";
    public const string AuthRegistered = "AUTH_REGISTERED";
    public const string AuthUserLoaded = "AUTH_USER_LOADED";

    public const string AuthRequired = "AUTH_REQUIRED";
    public const string InvalidRequestBody = "INVALID_REQUEST_BODY";
    public const string TaskNotFound = "TASK_NOT_FOUND";
    public const string TaskTitleRequired = "TASK_TITLE_REQUIRED";
    public const string ValidationError = "VALIDATION_ERROR";
    public const string UnexpectedError = "UNEXPECTED_ERROR";
}
