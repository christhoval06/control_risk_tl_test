using TaskManagement.Api.Domain;
using TaskManagement.Api.Services;
using Xunit;

namespace TaskManagement.Tests;

public sealed class TaskStatusEventPublisherTests
{
    [Fact]
    public async Task PublishAsync_DeliversStatusEventToSubscriber()
    {
        var publisher = new InMemoryTaskStatusEventPublisher();
        var taskId = Guid.NewGuid();
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(2));
        await using var subscription = publisher.Subscribe(timeout.Token);

        await publisher.PublishAsync(new TaskStatusEvent(taskId, TaskItemStatus.InProgress), timeout.Token);

        var hasEvent = await subscription.Events.WaitToReadAsync(timeout.Token);
        var received = await subscription.Events.ReadAsync(timeout.Token);

        Assert.True(hasEvent);
        Assert.Equal(taskId, received.Id);
        Assert.Equal(TaskItemStatus.InProgress, received.Status);
    }
}
