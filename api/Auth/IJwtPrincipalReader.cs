using Microsoft.Azure.Functions.Worker.Http;

namespace TaskManagement.Api.Auth;

public interface IJwtPrincipalReader
{
    string? GetUserId(HttpRequestData request);
}
