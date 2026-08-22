using System.Security.Claims;
using Microsoft.Azure.Functions.Worker.Http;

namespace TaskManagement.Api.Auth;

public sealed class JwtPrincipalReader : IJwtPrincipalReader
{
    public string? GetUserId(HttpRequestData request)
    {
        return request.Identities
            .SelectMany(identity => identity.Claims)
            .FirstOrDefault(IsStableUserClaim)
            ?.Value;
    }

    private static bool IsStableUserClaim(Claim claim)
    {
        return claim.Type is ClaimTypes.NameIdentifier or "sub" or "oid";
    }
}
