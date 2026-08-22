using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Services;

namespace TaskManagement.Api.Functions.Auth;

public sealed class MeFunction
{
    private readonly IAuthService _authService;
    private readonly IJwtPrincipalReader _principalReader;

    public MeFunction(IAuthService authService, IJwtPrincipalReader principalReader)
    {
        _authService = authService;
        _principalReader = principalReader;
    }

    [Function(nameof(MeFunction))]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "auth/me")] HttpRequestData request,
        CancellationToken cancellationToken)
    {
        var principal = _principalReader.GetPrincipal(request);
        if (principal is null)
        {
            return request.CreateErrorResponse(HttpStatusCode.Unauthorized, ErrorCatalog.AuthRequired);
        }

        var result = await _authService.GetCurrentUserAsync(principal, cancellationToken);

        return request.CreateServiceResponse(HttpStatusCode.OK, result);
    }
}
