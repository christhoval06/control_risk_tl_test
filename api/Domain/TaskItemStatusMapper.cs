namespace TaskManagement.Api.Domain;

public static class TaskItemStatusMapper
{
    public static string ToStorageValue(this TaskItemStatus status)
    {
        return status switch
        {
            TaskItemStatus.Pending => "Pending",
            TaskItemStatus.InProgress => "In Progress",
            TaskItemStatus.Done => "Done",
            _ => throw new ArgumentOutOfRangeException(nameof(status), status, "Unsupported task status.")
        };
    }

    public static TaskItemStatus FromStorageValue(string status)
    {
        return status switch
        {
            "Pending" => TaskItemStatus.Pending,
            "In Progress" => TaskItemStatus.InProgress,
            "Done" => TaskItemStatus.Done,
            _ => throw new InvalidOperationException($"Unsupported task status '{status}'.")
        };
    }
}
