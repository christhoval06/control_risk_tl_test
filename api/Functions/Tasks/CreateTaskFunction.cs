using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Dtos;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Services;

namespace TaskManagement.Api.Functions.Tasks;

public sealed class CreateTaskFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ITaskService _taskService;
    private readonly IJwtPrincipalReader _principalReader;

    public CreateTaskFunction(ITaskService taskService, IJwtPrincipalReader principalReader)
    {
        _taskService = taskService;
        _principalReader = principalReader;
    }

    [Function(nameof(CreateTaskFunction))]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "tasks")] HttpRequestData request,
        CancellationToken cancellationToken)
    {
        var userId = _principalReader.GetUserId(request);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return request.CreateErrorResponse(HttpStatusCode.Unauthorized, ErrorCatalog.AuthRequired);
        }

        CreateTaskRequest? createRequest;
        try
        {
            createRequest = await JsonSerializer.DeserializeAsync<CreateTaskRequest>(
                request.Body,
                JsonOptions,
                cancellationToken);
        }
        catch (JsonException)
        {
            return request.CreateErrorResponse(HttpStatusCode.BadRequest, ErrorCatalog.InvalidRequestBody);
        }

        if (createRequest is null)
        {
            return request.CreateErrorResponse(HttpStatusCode.BadRequest, ErrorCatalog.InvalidRequestBody);
        }

        var created = await _taskService.CreateAsync(createRequest, userId, cancellationToken);

        return request.CreateServiceResponse(HttpStatusCode.Created, created);
    }
}
