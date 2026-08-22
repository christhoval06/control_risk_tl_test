using System.Net;

namespace TaskManagement.Api.Functions;

public static class QueryStringReader
{
    public static IReadOnlyDictionary<string, string> Read(Uri url)
    {
        if (string.IsNullOrWhiteSpace(url.Query))
        {
            return new Dictionary<string, string>();
        }

        return url.Query
            .TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.Split('=', 2))
            .Where(parts => parts.Length > 0 && !string.IsNullOrWhiteSpace(parts[0]))
            .ToDictionary(
                parts => WebUtility.UrlDecode(parts[0]),
                parts => parts.Length == 2 ? WebUtility.UrlDecode(parts[1]) : string.Empty,
                StringComparer.OrdinalIgnoreCase);
    }

    public static string? GetValueOrDefault(this IReadOnlyDictionary<string, string> values, string key)
    {
        return values.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : null;
    }

    public static int GetIntOrDefault(this IReadOnlyDictionary<string, string> values, string key, int defaultValue)
    {
        return int.TryParse(values.GetValueOrDefault(key), out var value)
            ? value
            : defaultValue;
    }
}
