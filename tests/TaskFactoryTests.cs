using TaskManagement.Api.Domain;
using Xunit;
using DomainTaskFactory = TaskManagement.Api.Factories.TaskFactory;

namespace TaskManagement.Tests;

public sealed class TaskFactoryTests
{
    [Fact]
    public void Create_DefaultsStatusToPendingAndSetsOwner()
    {
        var factory = new DomainTaskFactory();

        var task = factory.Create("Pay invoice", null, null, "user-1", "user-2");

        Assert.Equal("Pay invoice", task.Title);
        Assert.Equal(TaskItemStatus.Pending, task.Status);
        Assert.Equal("user-1", task.CreatedBy);
        Assert.Equal("user-2", task.AssignedTo);
    }

    [Fact]
    public void Create_TrimsTitleBeforePersistingDomainModel()
    {
        var factory = new DomainTaskFactory();

        var task = factory.Create("  Pay invoice  ", null, null, "user-1", null);

        Assert.Equal("Pay invoice", task.Title);
    }

    [Fact]
    public void Create_RejectsBlankTitle()
    {
        var factory = new DomainTaskFactory();

        var exception = Assert.Throws<ArgumentException>(() =>
            factory.Create("   ", null, null, "user-1", null));

        Assert.Equal("title", exception.ParamName);
    }

    [Fact]
    public void Create_RejectsBlankCreator()
    {
        var factory = new DomainTaskFactory();

        var exception = Assert.Throws<ArgumentException>(() =>
            factory.Create("Pay invoice", null, null, "   ", null));

        Assert.Equal("createdBy", exception.ParamName);
    }
}
