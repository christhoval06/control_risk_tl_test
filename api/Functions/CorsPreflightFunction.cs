using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;

namespace TaskManagement.Api.Functions;

public sealed class CorsPreflightFunction
{
    [Function(nameof(CorsPreflightFunction))]
    public HttpResponseData Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "options", Route = "{*path}")] HttpRequestData request)
    {
        var response = request.CreateResponse();
        response.StatusCode = HttpStatusCode.NoContent;
        CorsHeaders.Apply(request, response);

        return response;
    }
}
