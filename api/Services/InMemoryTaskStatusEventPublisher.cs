using System.Threading.Channels;

namespace TaskManagement.Api.Services;

public sealed class InMemoryTaskStatusEventPublisher : ITaskStatusEventPublisher
{
    private readonly object _syncRoot = new();
    private readonly List<Channel<TaskStatusEvent>> _subscribers = [];

    public async Task PublishAsync(TaskStatusEvent statusEvent, CancellationToken cancellationToken)
    {
        Channel<TaskStatusEvent>[] subscribers;
        lock (_syncRoot)
        {
            subscribers = _subscribers.ToArray();
        }

        foreach (var subscriber in subscribers)
        {
            await subscriber.Writer.WriteAsync(statusEvent, cancellationToken);
        }
    }

    public TaskStatusEventSubscription Subscribe(CancellationToken cancellationToken)
    {
        var channel = Channel.CreateUnbounded<TaskStatusEvent>();
        lock (_syncRoot)
        {
            _subscribers.Add(channel);
        }

        cancellationToken.Register(() => Remove(channel));

        return new TaskStatusEventSubscription(channel.Reader, () => Remove(channel));
    }

    private void Remove(Channel<TaskStatusEvent> channel)
    {
        lock (_syncRoot)
        {
            if (_subscribers.Remove(channel))
            {
                channel.Writer.TryComplete();
            }
        }
    }
}
