using System.Text.Json;
using TaskManagement.Api.Domain;
using TaskManagement.Api.Functions;
using Xunit;

namespace TaskManagement.Tests;

public sealed class TaskItemStatusJsonConverterTests
{
    [Fact]
    public void Deserialize_AcceptsApiStatusValueWithSpace()
    {
        var result = JsonSerializer.Deserialize<StatusPayload>(
            """{"status":"In Progress"}""",
            ApiJsonOptions.SerializerOptions);

        Assert.Equal(TaskItemStatus.InProgress, result?.Status);
    }

    [Fact]
    public void Serialize_WritesApiStatusValueWithSpace()
    {
        var result = JsonSerializer.Serialize(
            new StatusPayload(TaskItemStatus.InProgress),
            ApiJsonOptions.SerializerOptions);

        Assert.Contains("\"status\":\"In Progress\"", result);
    }

    private sealed record StatusPayload(TaskItemStatus Status);
}
