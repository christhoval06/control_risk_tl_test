using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Services;

namespace TaskManagement.Api.Functions.Tasks;

public sealed class TaskStatusStreamFunction
{
    private readonly ITaskStatusEventPublisher _publisher;
    private readonly IJwtPrincipalReader _principalReader;

    public TaskStatusStreamFunction(
        ITaskStatusEventPublisher publisher,
        IJwtPrincipalReader principalReader)
    {
        _publisher = publisher;
        _principalReader = principalReader;
    }

    [Function(nameof(TaskStatusStreamFunction))]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "tasks/stream")] HttpRequestData request,
        CancellationToken cancellationToken)
    {
        var userId = _principalReader.GetUserId(request);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return request.CreateErrorResponse(HttpStatusCode.Unauthorized, ErrorCatalog.AuthRequired);
        }

        var response = request.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Content-Type", "text/event-stream");
        response.Headers.Add("Cache-Control", "no-cache");
        response.Headers.Add("Connection", "keep-alive");
        CorsHeaders.Apply(request, response);

        await using var subscription = _publisher.Subscribe(cancellationToken);
        await WriteAsync(response, ": connected\n\n", cancellationToken);

        await foreach (var statusEvent in subscription.Events.ReadAllAsync(cancellationToken))
        {
            var payload = JsonSerializer.Serialize(statusEvent, ApiJsonOptions.SerializerOptions);
            await WriteAsync(response, $"event: task-status-updated\ndata: {payload}\n\n", cancellationToken);
        }

        return response;
    }

    private static async Task WriteAsync(
        HttpResponseData response,
        string value,
        CancellationToken cancellationToken)
    {
        var bytes = Encoding.UTF8.GetBytes(value);
        await response.Body.WriteAsync(bytes, cancellationToken);
        await response.Body.FlushAsync(cancellationToken);
    }
}
