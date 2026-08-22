using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Dtos;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Services;

namespace TaskManagement.Api.Functions.Tasks;

public sealed class ListTasksFunction
{
    private readonly ITaskService _taskService;
    private readonly IJwtPrincipalReader _principalReader;

    public ListTasksFunction(ITaskService taskService, IJwtPrincipalReader principalReader)
    {
        _taskService = taskService;
        _principalReader = principalReader;
    }

    [Function(nameof(ListTasksFunction))]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "tasks")] HttpRequestData request,
        CancellationToken cancellationToken)
    {
        var userId = _principalReader.GetUserId(request);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return request.CreateErrorResponse(HttpStatusCode.Unauthorized, ErrorCatalog.AuthRequired);
        }

        var queryValues = QueryStringReader.Read(request.Url);
        var query = new TaskQuery(
            queryValues.GetValueOrDefault("status"),
            queryValues.GetValueOrDefault("assignedTo"),
            queryValues.GetValueOrDefault("search"),
            queryValues.GetValueOrDefault("sortBy") ?? "dueDate",
            queryValues.GetValueOrDefault("sortDirection") ?? "asc",
            queryValues.GetIntOrDefault("page", 1),
            queryValues.GetIntOrDefault("pageSize", 20));

        var result = await _taskService.ListAsync(query, userId, cancellationToken);

        return request.CreateServiceResponse(HttpStatusCode.OK, result);
    }
}
