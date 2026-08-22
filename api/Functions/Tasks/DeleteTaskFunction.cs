using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Services;

namespace TaskManagement.Api.Functions.Tasks;

public sealed class DeleteTaskFunction
{
    private readonly ITaskService _taskService;
    private readonly IJwtPrincipalReader _principalReader;

    public DeleteTaskFunction(ITaskService taskService, IJwtPrincipalReader principalReader)
    {
        _taskService = taskService;
        _principalReader = principalReader;
    }

    [Function(nameof(DeleteTaskFunction))]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "tasks/{id:guid}")] HttpRequestData request,
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = _principalReader.GetUserId(request);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return request.CreateJsonResponse(HttpStatusCode.Unauthorized, new { title = "Unauthorized", status = 401 });
        }

        var deleted = await _taskService.DeleteAsync(id, userId, cancellationToken);
        if (!deleted)
        {
            return request.CreateJsonResponse(HttpStatusCode.NotFound, new { title = "Task not found", status = 404 });
        }

        var response = request.CreateResponse();
        response.StatusCode = HttpStatusCode.NoContent;
        return response;
    }
}
