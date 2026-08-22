using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Services;

namespace TaskManagement.Api.Functions.Auth;

public sealed class LogoutFunction
{
    private readonly IAuthService _authService;
    private readonly IJwtPrincipalReader _principalReader;

    public LogoutFunction(IAuthService authService, IJwtPrincipalReader principalReader)
    {
        _authService = authService;
        _principalReader = principalReader;
    }

    [Function(nameof(LogoutFunction))]
    public HttpResponseData Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/logout")] HttpRequestData request)
    {
        var principal = _principalReader.GetPrincipal(request);
        if (principal is null)
        {
            return request.CreateErrorResponse(HttpStatusCode.Unauthorized, ErrorCatalog.AuthRequired);
        }

        return request.CreateServiceResponse(HttpStatusCode.OK, _authService.Logout());
    }
}
