using System.Threading.Channels;
using TaskManagement.Api.Domain;

namespace TaskManagement.Api.Services;

public interface ITaskStatusEventPublisher
{
    Task PublishAsync(TaskStatusEvent statusEvent, CancellationToken cancellationToken);

    TaskStatusEventSubscription Subscribe(CancellationToken cancellationToken);
}

public sealed record TaskStatusEvent(Guid Id, TaskItemStatus Status);

public sealed class TaskStatusEventSubscription : IAsyncDisposable
{
    private readonly Action _dispose;

    public TaskStatusEventSubscription(ChannelReader<TaskStatusEvent> events, Action dispose)
    {
        Events = events;
        _dispose = dispose;
    }

    public ChannelReader<TaskStatusEvent> Events { get; }

    public ValueTask DisposeAsync()
    {
        _dispose();
        return ValueTask.CompletedTask;
    }
}
