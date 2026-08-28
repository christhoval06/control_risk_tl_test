using System.Text;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Moq;
using TaskManagement.Api.Auth;
using Xunit;

namespace TaskManagement.Tests;

public sealed class JwtPrincipalReaderTests
{
    [Fact]
    public void GetPrincipal_ReadsClaimsFromBearerToken_WhenFunctionIdentitiesAreEmpty()
    {
        var request = CreateRequest(CreateUnsignedJwt(new Dictionary<string, object?>
        {
            ["sub"] = "external-1",
            ["email"] = "ana@example.com",
            ["name"] = "Ana",
            ["idp"] = "google"
        }));
        var reader = new JwtPrincipalReader();

        var principal = reader.GetPrincipal(request);

        Assert.NotNull(principal);
        Assert.Equal("external-1", principal.ExternalId);
        Assert.Equal("ana@example.com", principal.Email);
        Assert.Equal("Ana", principal.DisplayName);
        Assert.Equal("google", principal.Provider);
    }

    [Fact]
    public void GetPrincipal_ReadsClaimsFromAccessTokenQuery_WhenAuthorizationHeaderIsUnavailable()
    {
        var token = CreateUnsignedJwt(new Dictionary<string, object?>
        {
            ["sub"] = "external-2",
            ["preferred_username"] = "chris@example.com",
            ["name"] = "Chris",
            ["idp"] = "live.com"
        });
        var request = CreateRequestFromQueryToken(token);
        var reader = new JwtPrincipalReader();

        var principal = reader.GetPrincipal(request);

        Assert.NotNull(principal);
        Assert.Equal("external-2", principal.ExternalId);
        Assert.Equal("chris@example.com", principal.Email);
        Assert.Equal("Chris", principal.DisplayName);
        Assert.Equal("live.com", principal.Provider);
    }

    private static HttpRequestData CreateRequest(string token)
    {
        var context = new Mock<FunctionContext>().Object;
        var request = new Mock<HttpRequestData>(context);
        var headers = new HttpHeadersCollection
        {
            { "Authorization", $"Bearer {token}" }
        };

        request.SetupGet(item => item.Headers).Returns(headers);
        request.SetupGet(item => item.Url).Returns(new Uri("http://localhost:7071/api/auth/login"));

        return request.Object;
    }

    private static HttpRequestData CreateRequestFromQueryToken(string token)
    {
        var context = new Mock<FunctionContext>().Object;
        var request = new Mock<HttpRequestData>(context);

        request.SetupGet(item => item.Headers).Returns(new HttpHeadersCollection());
        request.SetupGet(item => item.Url).Returns(new Uri($"http://localhost:7071/api/tasks/stream?access_token={token}"));

        return request.Object;
    }

    private static string CreateUnsignedJwt(IReadOnlyDictionary<string, object?> payload)
    {
        return string.Join(
            ".",
            Base64UrlEncode("""{"alg":"none","typ":"JWT"}"""),
            Base64UrlEncode(JsonSerializer.Serialize(payload)),
            string.Empty);
    }

    private static string Base64UrlEncode(string value)
    {
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(value))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
