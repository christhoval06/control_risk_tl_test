using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker.Http;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Services;

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

    public static HttpResponseData CreateServiceResponse<T>(
        this HttpRequestData request,
        HttpStatusCode successStatusCode,
        ServiceResponse<T> serviceResponse)
    {
        var statusCode = serviceResponse.IsSuccess
            ? successStatusCode
            : ResolveErrorStatusCode(serviceResponse.Code);

        return request.CreateJsonResponse(statusCode, serviceResponse);
    }

    public static HttpResponseData CreateErrorResponse(
        this HttpRequestData request,
        HttpStatusCode statusCode,
        ErrorDefinition error)
    {
        return request.CreateJsonResponse(statusCode, ServiceResponse<object?>.Error(error));
    }

    private static HttpStatusCode ResolveErrorStatusCode(string code)
    {
        return code switch
        {
            ServiceCodes.AuthRequired => HttpStatusCode.Unauthorized,
            ServiceCodes.InvalidRequestBody => HttpStatusCode.BadRequest,
            ServiceCodes.TaskNotFound => HttpStatusCode.NotFound,
            ServiceCodes.TaskTitleRequired => HttpStatusCode.BadRequest,
            ServiceCodes.ValidationError => HttpStatusCode.BadRequest,
            _ => HttpStatusCode.InternalServerError
        };
    }
}
