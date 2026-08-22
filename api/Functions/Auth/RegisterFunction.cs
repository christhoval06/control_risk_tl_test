using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Dtos.Auth;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Services;

namespace TaskManagement.Api.Functions.Auth;

public sealed class RegisterFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly IAuthService _authService;
    private readonly IJwtPrincipalReader _principalReader;

    public RegisterFunction(IAuthService authService, IJwtPrincipalReader principalReader)
    {
        _authService = authService;
        _principalReader = principalReader;
    }

    [Function(nameof(RegisterFunction))]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/register")] HttpRequestData request,
        CancellationToken cancellationToken)
    {
        var principal = _principalReader.GetPrincipal(request);
        if (principal is null)
        {
            return request.CreateErrorResponse(HttpStatusCode.Unauthorized, ErrorCatalog.AuthRequired);
        }

        RegisterUserRequest? registerRequest;
        try
        {
            registerRequest = await JsonSerializer.DeserializeAsync<RegisterUserRequest>(
                request.Body,
                JsonOptions,
                cancellationToken);
        }
        catch (JsonException)
        {
            return request.CreateErrorResponse(HttpStatusCode.BadRequest, ErrorCatalog.InvalidRequestBody);
        }

        if (registerRequest is null)
        {
            return request.CreateErrorResponse(HttpStatusCode.BadRequest, ErrorCatalog.InvalidRequestBody);
        }

        var result = await _authService.RegisterAsync(principal, registerRequest, cancellationToken);

        return request.CreateServiceResponse(HttpStatusCode.OK, result);
    }
}
