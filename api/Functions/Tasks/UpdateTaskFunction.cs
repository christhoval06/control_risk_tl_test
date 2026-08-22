using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Dtos;
using TaskManagement.Api.Services;

namespace TaskManagement.Api.Functions.Tasks;

public sealed class UpdateTaskFunction
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

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
            return request.CreateJsonResponse(HttpStatusCode.Unauthorized, new { title = "Unauthorized", status = 401 });
        }

        var updateRequest = await JsonSerializer.DeserializeAsync<UpdateTaskRequest>(
            request.Body,
            JsonOptions,
            cancellationToken);

        if (updateRequest is null)
        {
            return request.CreateJsonResponse(HttpStatusCode.BadRequest, new { title = "Invalid request body", status = 400 });
        }

        var task = await _taskService.UpdateAsync(id, updateRequest, userId, cancellationToken);
        if (task is null)
        {
            return request.CreateJsonResponse(HttpStatusCode.NotFound, new { title = "Task not found", status = 404 });
        }

        return request.CreateJsonResponse(HttpStatusCode.OK, task);
    }
}
