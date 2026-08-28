using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Dtos;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Services;

namespace TaskManagement.Api.Functions.Tasks;

public sealed class UpdateTaskFunction
{
    private readonly ITaskService _taskService;
    private readonly IJwtPrincipalReader _principalReader;

    public UpdateTaskFunction(ITaskService taskService, IJwtPrincipalReader principalReader)
    {
        _taskService = taskService;
        _principalReader = principalReader;
    }

    [Function(nameof(UpdateTaskFunction))]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "tasks/{id:guid}")] HttpRequestData request,
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = _principalReader.GetUserId(request);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return request.CreateErrorResponse(HttpStatusCode.Unauthorized, ErrorCatalog.AuthRequired);
        }

        UpdateTaskRequest? updateRequest;
        try
        {
            updateRequest = await JsonSerializer.DeserializeAsync<UpdateTaskRequest>(
                request.Body,
                ApiJsonOptions.SerializerOptions,
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

        var result = await _taskService.UpdateAsync(id, updateRequest, userId, cancellationToken);

        return request.CreateServiceResponse(HttpStatusCode.OK, result);
    }
}
