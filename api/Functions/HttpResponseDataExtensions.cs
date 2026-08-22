using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker.Http;

namespace TaskManagement.Api.Functions;

public static class HttpResponseDataExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static HttpResponseData CreateJsonResponse(
        this HttpRequestData request,
        HttpStatusCode statusCode,
        object body)
    {
        var response = request.CreateResponse();
        response.StatusCode = statusCode;
        response.Headers.Add("Content-Type", "application/json");
        JsonSerializer.Serialize(response.Body, body, JsonOptions);
        response.Body.Position = 0;

        return response;
    }
}
