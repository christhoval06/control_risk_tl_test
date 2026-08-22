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

        var service = new TaskService(repository.Object, new DomainTaskFactory());

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

        var service = new TaskService(repository.Object, new DomainTaskFactory());

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

        var service = new TaskService(repository.Object, new DomainTaskFactory());

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
}
