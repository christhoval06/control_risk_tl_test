using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Moq;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Dtos.Auth;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Functions.Auth;
using TaskManagement.Api.Services;
using Xunit;

namespace TaskManagement.Tests;

public sealed class LoginFunctionTests
{
    [Fact]
    public async Task Run_ReturnsUnauthorizedEnvelope_WhenPrincipalIsMissing()
    {
        var service = new Mock<IAuthService>();
        var principalReader = new Mock<IJwtPrincipalReader>();
        principalReader
            .Setup(reader => reader.GetPrincipal(It.IsAny<HttpRequestData>()))
            .Returns((AuthPrincipal?)null);

        var function = new LoginFunction(service.Object, principalReader.Object);

        var response = await function.Run(CreateRequest(), CancellationToken.None);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        var body = ReadJson(response);
        Assert.Equal(ServiceResponseStatus.Error, body.RootElement.GetProperty("status").GetString());
        Assert.Equal(ServiceCodes.AuthRequired, body.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task Run_ReturnsLoginEnvelope_WhenPrincipalExists()
    {
        var principal = new AuthPrincipal("external-1", "ana@example.com", "Ana", "github");
        var service = new Mock<IAuthService>();
        service
            .Setup(service => service.LoginAsync(principal, It.IsAny<CancellationToken>()))
            .ReturnsAsync(ServiceResponse<AuthUserResponse>.Ok(
                new AuthUserResponse("external-1", "ana@example.com", "Ana", "github"),
                ServiceCodes.AuthLoginOk,
                "Login completed successfully."));
        var principalReader = new Mock<IJwtPrincipalReader>();
        principalReader
            .Setup(reader => reader.GetPrincipal(It.IsAny<HttpRequestData>()))
            .Returns(principal);

        var function = new LoginFunction(service.Object, principalReader.Object);

        var response = await function.Run(CreateRequest(), CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = ReadJson(response);
        Assert.Equal(ServiceCodes.AuthLoginOk, body.RootElement.GetProperty("code").GetString());
        Assert.Equal("github", body.RootElement.GetProperty("data").GetProperty("provider").GetString());
    }

    private static HttpRequestData CreateRequest()
    {
        var context = new Mock<FunctionContext>().Object;
        var request = new Mock<HttpRequestData>(context);
        var response = new Mock<HttpResponseData>(context);

        response.SetupProperty(item => item.StatusCode);
        response.SetupGet(item => item.Headers).Returns(new HttpHeadersCollection());
        response.SetupGet(item => item.Body).Returns(new MemoryStream());
        request.Setup(item => item.CreateResponse()).Returns(response.Object);

        return request.Object;
    }

    private static JsonDocument ReadJson(HttpResponseData response)
    {
        response.Body.Position = 0;
        return JsonDocument.Parse(response.Body);
    }
}
