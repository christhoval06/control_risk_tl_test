using System.Text.Json;
using TaskManagement.Api.Domain;

namespace TaskManagement.Api.Functions;

public static class ApiJsonOptions
{
    public static JsonSerializerOptions SerializerOptions { get; } = Create();

    private static JsonSerializerOptions Create()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        options.Converters.Add(new TaskItemStatusJsonConverter());

        return options;
    }
}
