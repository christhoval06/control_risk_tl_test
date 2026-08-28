using Microsoft.Azure.Functions.Worker.Http;

namespace TaskManagement.Api.Functions;

public static class CorsHeaders
{
    private const string DefaultAllowedOrigin = "http://localhost:5173";

    public static void Apply(HttpRequestData request, HttpResponseData response)
    {
        if (!TryGetOrigin(request, out var origin) || !IsAllowedOrigin(origin))
        {
            return;
        }

        Set(response.Headers, "Access-Control-Allow-Origin", origin);
        Set(response.Headers, "Vary", "Origin");
        Set(response.Headers, "Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        Set(response.Headers, "Access-Control-Allow-Headers", "authorization,content-type");
    }

    private static bool TryGetOrigin(HttpRequestData request, out string origin)
    {
        origin = string.Empty;
        if (request.Headers is null || !request.Headers.TryGetValues("Origin", out var values))
        {
            return false;
        }

        origin = values.FirstOrDefault() ?? string.Empty;
        return !string.IsNullOrWhiteSpace(origin);
    }

    private static bool IsAllowedOrigin(string origin)
    {
        return GetAllowedOrigins().Contains(origin, StringComparer.OrdinalIgnoreCase);
    }

    private static string[] GetAllowedOrigins()
    {
        var configuredOrigins = Environment.GetEnvironmentVariable("Cors__AllowedOrigins");
        if (string.IsNullOrWhiteSpace(configuredOrigins))
        {
            return [DefaultAllowedOrigin];
        }

        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<string[]>(configuredOrigins) ?? [DefaultAllowedOrigin];
        }
        catch
        {
            return configuredOrigins
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        }
    }

    private static void Set(HttpHeadersCollection headers, string name, string value)
    {
        if (headers.Contains(name))
        {
            headers.Remove(name);
        }

        headers.Add(name, value);
    }
}
