using System.Security.Claims;
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
}
