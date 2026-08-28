using System.Text.Json;
using System.Text.Json.Serialization;

namespace TaskManagement.Api.Domain;

public sealed class TaskItemStatusJsonConverter : JsonConverter<TaskItemStatus>
{
    public override TaskItemStatus Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new JsonException("Task status is required.");
        }

        return TaskItemStatusMapper.FromStorageValue(value);
    }

    public override void Write(
        Utf8JsonWriter writer,
        TaskItemStatus value,
        JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToStorageValue());
    }
}
