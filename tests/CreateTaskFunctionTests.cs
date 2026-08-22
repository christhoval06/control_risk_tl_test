using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Moq;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Functions.Tasks;
using TaskManagement.Api.Services;
using Xunit;

namespace TaskManagement.Tests;

public sealed class CreateTaskFunctionTests
{
    [Fact]
    public async Task Run_ReturnsUnauthorized_WhenUserIsMissing()
    {
        var service = new Mock<ITaskService>();
        var principalReader = new Mock<IJwtPrincipalReader>();
        principalReader
            .Setup(reader => reader.GetUserId(It.IsAny<HttpRequestData>()))
            .Returns((string?)null);

        var function = new CreateTaskFunction(service.Object, principalReader.Object);

        var response = await function.Run(CreateRequest("{}"), CancellationToken.None);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var body = ReadJson(response);
        Assert.Equal(ServiceResponseStatus.Error, body.RootElement.GetProperty("status").GetString());
        Assert.Equal(ServiceCodes.AuthRequired, body.RootElement.GetProperty("code").GetString());
        Assert.Equal("Authentication is required.", body.RootElement.GetProperty("message").GetString());
        Assert.Equal(JsonValueKind.Null, body.RootElement.GetProperty("data").ValueKind);
    }

    [Fact]
    public async Task Run_ReturnsBadRequestEnvelope_WhenRequestBodyIsInvalid()
    {
        var service = new Mock<ITaskService>();
        var principalReader = new Mock<IJwtPrincipalReader>();
        principalReader
            .Setup(reader => reader.GetUserId(It.IsAny<HttpRequestData>()))
            .Returns("user-1");

        var function = new CreateTaskFunction(service.Object, principalReader.Object);

        var response = await function.Run(CreateRequest(""), CancellationToken.None);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = ReadJson(response);
        Assert.Equal(ServiceResponseStatus.Error, body.RootElement.GetProperty("status").GetString());
        Assert.Equal(ServiceCodes.InvalidRequestBody, body.RootElement.GetProperty("code").GetString());
    }

    private static HttpRequestData CreateRequest(string body)
    {
        var context = new Mock<FunctionContext>().Object;
        var request = new Mock<HttpRequestData>(context);
        var response = new Mock<HttpResponseData>(context);

        response.SetupProperty(item => item.StatusCode);
        response.SetupGet(item => item.Headers).Returns(new HttpHeadersCollection());
        response.SetupGet(item => item.Body).Returns(new MemoryStream());

        request.SetupGet(item => item.Body).Returns(new MemoryStream(Encoding.UTF8.GetBytes(body)));
        request.Setup(item => item.CreateResponse()).Returns(response.Object);

        return request.Object;
    }

    private static JsonDocument ReadJson(HttpResponseData response)
    {
        response.Body.Position = 0;
        return JsonDocument.Parse(response.Body);
    }
}
