using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Dtos;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Services;

namespace TaskManagement.Api.Functions.Tasks;

public sealed class UpdateTaskStatusFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ITaskService _taskService;
    private readonly IJwtPrincipalReader _principalReader;

    public UpdateTaskStatusFunction(ITaskService taskService, IJwtPrincipalReader principalReader)
    {
        _taskService = taskService;
        _principalReader = principalReader;
    }

    [Function(nameof(UpdateTaskStatusFunction))]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "patch", Route = "tasks/{id:guid}/status")] HttpRequestData request,
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = _principalReader.GetUserId(request);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return request.CreateErrorResponse(HttpStatusCode.Unauthorized, ErrorCatalog.AuthRequired);
        }

        UpdateTaskStatusRequest? updateRequest;
        try
        {
            updateRequest = await JsonSerializer.DeserializeAsync<UpdateTaskStatusRequest>(
                request.Body,
                JsonOptions,
                cancellationToken);
        }
        catch (JsonException)
        {
            return request.CreateErrorResponse(HttpStatusCode.BadRequest, ErrorCatalog.InvalidRequestBody);
        }

        if (updateRequest is null)
        {
            return request.CreateErrorResponse(HttpStatusCode.BadRequest, ErrorCatalog.InvalidRequestBody);
        }

        var result = await _taskService.UpdateStatusAsync(id, updateRequest, userId, cancellationToken);

        return request.CreateServiceResponse(HttpStatusCode.OK, result);
    }
}
