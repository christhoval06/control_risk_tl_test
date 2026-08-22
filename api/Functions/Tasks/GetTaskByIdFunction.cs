using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Services;

namespace TaskManagement.Api.Functions.Tasks;

public sealed class GetTaskByIdFunction
{
    private readonly ITaskService _taskService;
    private readonly IJwtPrincipalReader _principalReader;

    public GetTaskByIdFunction(ITaskService taskService, IJwtPrincipalReader principalReader)
    {
        _taskService = taskService;
        _principalReader = principalReader;
    }

    [Function(nameof(GetTaskByIdFunction))]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "tasks/{id:guid}")] HttpRequestData request,
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = _principalReader.GetUserId(request);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return request.CreateJsonResponse(HttpStatusCode.Unauthorized, new { title = "Unauthorized", status = 401 });
        }

        var task = await _taskService.GetByIdAsync(id, userId, cancellationToken);
        if (task is null)
        {
            return request.CreateJsonResponse(HttpStatusCode.NotFound, new { title = "Task not found", status = 404 });
        }

        return request.CreateJsonResponse(HttpStatusCode.OK, task);
    }
}
