using System.Text.Json.Serialization;
using TaskManagement.Api.Errors;

namespace TaskManagement.Api.Services;

/// <summary>
/// Standard service result envelope shared by backend services and HTTP responses.
/// </summary>
public sealed record ServiceResponse<T>(
    T? Data,
    string Code,
    string Status,
    string Message)
{
    [JsonIgnore]
    public bool IsSuccess => Status == ServiceResponseStatus.Ok;

    public static ServiceResponse<T> Ok(T? data, string code, string message)
    {
        return new ServiceResponse<T>(data, code, ServiceResponseStatus.Ok, message);
    }

    public static ServiceResponse<T> Error(ErrorDefinition error)
    {
        return new ServiceResponse<T>(default, error.Code, ServiceResponseStatus.Error, error.Message);
    }
}
