using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker.Http;

namespace TaskManagement.Api.Auth;

public sealed class JwtPrincipalReader : IJwtPrincipalReader
{
    public string? GetUserId(HttpRequestData request)
    {
        return GetPrincipal(request)?.ExternalId;
    }

    public AuthPrincipal? GetPrincipal(HttpRequestData request)
    {
        var claims = request.Identities
            .SelectMany(identity => identity.Claims)
            .ToArray();

        if (claims.Length == 0)
        {
            claims = ReadBearerTokenClaims(request).ToArray();
        }

        var externalId = claims.FirstOrDefault(IsStableUserClaim)?.Value;
        if (string.IsNullOrWhiteSpace(externalId))
        {
            return null;
        }

        return new AuthPrincipal(
            externalId,
            FindFirstValue(claims, ClaimTypes.Email, "email", "preferred_username", "upn"),
            FindFirstValue(claims, ClaimTypes.Name, "name"),
            FindFirstValue(claims, "idp", "identity_provider", "iss") ?? "external");
    }

    private static bool IsStableUserClaim(Claim claim)
    {
        return claim.Type is ClaimTypes.NameIdentifier or "sub" or "oid";
    }

    private static string? FindFirstValue(IEnumerable<Claim> claims, params string[] types)
    {
        return claims.FirstOrDefault(claim => types.Contains(claim.Type, StringComparer.OrdinalIgnoreCase))?.Value;
    }

    private static IEnumerable<Claim> ReadBearerTokenClaims(HttpRequestData request)
    {
        if (!IsLocalDevelopmentRequest(request))
        {
            return [];
        }

        var token = ReadToken(request);
        var segments = token.Split('.');
        if (segments.Length < 2)
        {
            return [];
        }

        try
        {
            var json = Encoding.UTF8.GetString(Base64UrlDecode(segments[1]));
            using var payload = JsonDocument.Parse(json);

            return payload.RootElement
                .EnumerateObject()
                .Where(property => property.Value.ValueKind is JsonValueKind.String or JsonValueKind.Number)
                .Select(property => new Claim(property.Name, property.Value.ToString()))
                .ToArray();
        }
        catch (JsonException)
        {
            return [];
        }
        catch (FormatException)
        {
            return [];
        }
    }

    private static byte[] Base64UrlDecode(string value)
    {
        var padded = value.Replace('-', '+').Replace('_', '/');
        padded = padded.PadRight(padded.Length + ((4 - padded.Length % 4) % 4), '=');

        return Convert.FromBase64String(padded);
    }

    private static string ReadToken(HttpRequestData request)
    {
        if (request.Headers.TryGetValues("Authorization", out var values))
        {
            var header = values.FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(header) && header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return header["Bearer ".Length..].Trim();
            }
        }

        var queryValues = Functions.QueryStringReader.Read(request.Url);

        return queryValues.GetValueOrDefault("access_token") ?? string.Empty;
    }

    private static bool IsLocalDevelopmentRequest(HttpRequestData request)
    {
        var host = request.Url.Host;

        return request.Url.IsLoopback
            || string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase)
            || string.Equals(host, "127.0.0.1", StringComparison.OrdinalIgnoreCase);
    }
}
