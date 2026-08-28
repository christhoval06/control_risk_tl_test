using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Moq;
using TaskManagement.Api.Functions;
using Xunit;

namespace TaskManagement.Tests;

public sealed class CorsPreflightFunctionTests
{
    [Fact]
    public void Run_ReturnsCorsHeadersForAllowedOrigin()
    {
        var function = new CorsPreflightFunction();

        var response = function.Run(CreateRequest("http://localhost:5173"));

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Contains("http://localhost:5173", response.Headers.GetValues("Access-Control-Allow-Origin"));
        Assert.Contains("POST", response.Headers.GetValues("Access-Control-Allow-Methods").Single());
        Assert.Contains("authorization", response.Headers.GetValues("Access-Control-Allow-Headers").Single());
    }

    private static HttpRequestData CreateRequest(string origin)
    {
        var context = new Mock<FunctionContext>().Object;
        var request = new Mock<HttpRequestData>(context);
        var response = new Mock<HttpResponseData>(context);
        var requestHeaders = new HttpHeadersCollection { { "Origin", origin } };

        response.SetupProperty(item => item.StatusCode);
        response.SetupGet(item => item.Headers).Returns(new HttpHeadersCollection());
        response.SetupGet(item => item.Body).Returns(new MemoryStream());
        request.SetupGet(item => item.Headers).Returns(requestHeaders);
        request.Setup(item => item.CreateResponse()).Returns(response.Object);

        return request.Object;
    }
}
