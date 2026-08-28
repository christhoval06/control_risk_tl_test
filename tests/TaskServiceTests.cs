using Moq;
using TaskManagement.Api.Domain;
using TaskManagement.Api.Dtos;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Factories;
using TaskManagement.Api.Repositories;
using TaskManagement.Api.Services;
using Xunit;
using DomainTaskFactory = TaskManagement.Api.Factories.TaskFactory;

namespace TaskManagement.Tests;

public sealed class TaskServiceTests
{
    [Fact]
    public async Task CreateAsync_PersistsTaskForAuthenticatedUser()
    {
        TaskItem? capturedTask = null;
        var repository = new Mock<ITaskRepository>();
        repository
            .Setup(repository => repository.CreateAsync(It.IsAny<TaskItem>(), It.IsAny<CancellationToken>()))
            .Callback<TaskItem, CancellationToken>((task, _) => capturedTask = task)
            .ReturnsAsync((TaskItem task, CancellationToken _) => task);

        var service = CreateService(repository.Object);

        var result = await service.CreateAsync(
            new CreateTaskRequest("Pay invoice", "Vendor payment", null, "assignee-1"),
            "creator-1",
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(ServiceResponseStatus.Ok, result.Status);
        Assert.Equal(ServiceCodes.TaskCreated, result.Code);
        Assert.Equal("Task created successfully.", result.Message);
        Assert.Equal("Pay invoice", result.Data?.Title);
        Assert.Equal("creator-1", result.Data?.CreatedBy);
        Assert.Equal("assignee-1", result.Data?.AssignedTo);
        Assert.Equal(TaskItemStatus.Pending, capturedTask?.Status);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNotFoundError_WhenTaskDoesNotExist()
    {
        var repository = new Mock<ITaskRepository>();
        repository
            .Setup(repository => repository.GetByIdAsync(
                It.IsAny<Guid>(),
                "user-1",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((TaskItem?)null);

        var service = CreateService(repository.Object);

        var result = await service.GetByIdAsync(Guid.NewGuid(), "user-1", CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(ServiceResponseStatus.Error, result.Status);
        Assert.Equal(ServiceCodes.TaskNotFound, result.Code);
        Assert.Equal("Task was not found.", result.Message);
        Assert.Null(result.Data);
    }

    [Fact]
    public async Task ListAsync_NormalizesInvalidPagingBeforeQueryingRepository()
    {
        TaskQuery? capturedQuery = null;
        var repository = new Mock<ITaskRepository>();
        repository
            .Setup(repository => repository.ListAsync("user-1", It.IsAny<TaskQuery>(), It.IsAny<CancellationToken>()))
            .Callback<string, TaskQuery, CancellationToken>((_, query, _) => capturedQuery = query)
            .ReturnsAsync(Array.Empty<TaskItem>());

        var service = CreateService(repository.Object);

        var result = await service.ListAsync(
            new TaskQuery(null, null, null, "unknown", "sideways", 0, 250),
            "user-1",
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(ServiceCodes.TasksListed, result.Code);
        Assert.Empty(result.Data?.Items ?? Array.Empty<TaskResponse>());
        Assert.Equal(1, capturedQuery?.Page);
        Assert.Equal(100, capturedQuery?.PageSize);
        Assert.Equal("dueDate", capturedQuery?.SortBy);
        Assert.Equal("asc", capturedQuery?.SortDirection);
    }

    [Fact]
    public async Task ListAsync_ReturnsCachedTasks_WhenCacheHasValue()
    {
        var cached = new TaskListResponse(
            new[]
            {
                new TaskResponse(
                    Guid.NewGuid(),
                    "Cached task",
                    null,
                    null,
                    TaskItemStatus.Pending,
                    "user-1",
                    null,
                    DateTime.UtcNow,
                    DateTime.UtcNow)
            },
            1,
            20);
        var repository = new Mock<ITaskRepository>();
        var cache = new Mock<ICacheService>();
        cache
            .Setup(cache => cache.GetAsync<TaskListResponse>(
                It.Is<string>(key => key.StartsWith("tasks:list:user-1:", StringComparison.Ordinal)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cached);

        var service = CreateService(repository.Object, cache: cache.Object);

        var result = await service.ListAsync(new TaskQuery(null, null, null), "user-1", CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Cached task", result.Data?.Items.Single().Title);
        repository.Verify(
            repository => repository.ListAsync(It.IsAny<string>(), It.IsAny<TaskQuery>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ListAsync_CachesRepositoryTasks_WhenCacheMisses()
    {
        var repository = new Mock<ITaskRepository>();
        var cache = new Mock<ICacheService>();
        repository
            .Setup(repository => repository.ListAsync("user-1", It.IsAny<TaskQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new TaskItem(
                    Guid.NewGuid(),
                    "Repository task",
                    null,
                    null,
                    TaskItemStatus.Pending,
                    "user-1",
                    null,
                    DateTime.UtcNow,
                    DateTime.UtcNow)
            });

        var service = CreateService(repository.Object, cache: cache.Object);

        var result = await service.ListAsync(new TaskQuery(null, null, null), "user-1", CancellationToken.None);

        Assert.True(result.IsSuccess);
        cache.Verify(
            cache => cache.SetAsync(
                It.Is<string>(key => key.StartsWith("tasks:list:user-1:", StringComparison.Ordinal)),
                It.Is<TaskListResponse>(response => response.Items.Single().Title == "Repository task"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_PublishesStatusEvent_WhenTaskIsUpdated()
    {
        var taskId = Guid.NewGuid();
        var repository = new Mock<ITaskRepository>();
        var publisher = new Mock<ITaskStatusEventPublisher>();
        repository
            .Setup(repository => repository.UpdateStatusAsync(
                taskId,
                "user-1",
                TaskItemStatus.InProgress,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TaskItem(
                taskId,
                "Review risk",
                null,
                null,
                TaskItemStatus.InProgress,
                "user-1",
                null,
                DateTime.UtcNow,
                DateTime.UtcNow));

        var service = CreateService(repository.Object, publisher.Object);

        var result = await service.UpdateStatusAsync(
            taskId,
            new UpdateTaskStatusRequest(TaskItemStatus.InProgress),
            "user-1",
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        publisher.Verify(
            publisher => publisher.PublishAsync(
                It.Is<TaskStatusEvent>(statusEvent =>
                    statusEvent.Id == taskId && statusEvent.Status == TaskItemStatus.InProgress),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task UpdateStatusAsync_InvalidatesUserTaskCache_WhenTaskIsUpdated()
    {
        var taskId = Guid.NewGuid();
        var repository = new Mock<ITaskRepository>();
        var cache = new Mock<ICacheService>();
        repository
            .Setup(repository => repository.UpdateStatusAsync(
                taskId,
                "user-1",
                TaskItemStatus.InProgress,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TaskItem(
                taskId,
                "Review risk",
                null,
                null,
                TaskItemStatus.InProgress,
                "user-1",
                null,
                DateTime.UtcNow,
                DateTime.UtcNow));

        var service = CreateService(repository.Object, cache: cache.Object);

        var result = await service.UpdateStatusAsync(
            taskId,
            new UpdateTaskStatusRequest(TaskItemStatus.InProgress),
            "user-1",
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        cache.Verify(
            cache => cache.RemoveByPrefixAsync("tasks:list:user-1:", It.IsAny<CancellationToken>()),
            Times.Once);
        cache.Verify(
            cache => cache.RemoveAsync($"tasks:item:user-1:{taskId}", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsCachedTask_WhenCacheHasValue()
    {
        var taskId = Guid.NewGuid();
        var cached = new TaskResponse(
            taskId,
            "Cached task",
            null,
            null,
            TaskItemStatus.Done,
            "user-1",
            null,
            DateTime.UtcNow,
            DateTime.UtcNow);
        var repository = new Mock<ITaskRepository>();
        var cache = new Mock<ICacheService>();
        cache
            .Setup(cache => cache.GetAsync<TaskResponse>($"tasks:item:user-1:{taskId}", It.IsAny<CancellationToken>()))
            .ReturnsAsync(cached);

        var service = CreateService(repository.Object, cache: cache.Object);

        var result = await service.GetByIdAsync(taskId, "user-1", CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Cached task", result.Data?.Title);
        repository.Verify(
            repository => repository.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static TaskService CreateService(
        ITaskRepository repository,
        ITaskStatusEventPublisher? publisher = null,
        ICacheService? cache = null)
    {
        return new TaskService(
            repository,
            new DomainTaskFactory(),
            publisher ?? Mock.Of<ITaskStatusEventPublisher>(),
            cache ?? Mock.Of<ICacheService>());
    }
}
