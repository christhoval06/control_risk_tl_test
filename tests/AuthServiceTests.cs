using Moq;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Dtos.Auth;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Repositories;
using TaskManagement.Api.Services;
using Xunit;

namespace TaskManagement.Tests;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task LoginAsync_UpsertsUserProfileFromAuthenticatedPrincipal()
    {
        var principal = new AuthPrincipal("external-1", "ana@example.com", "Ana", "google");
        var repository = new Mock<IUserRepository>();
        repository
            .Setup(repository => repository.UpsertAsync(
                principal.ExternalId,
                principal.Email,
                principal.DisplayName,
                principal.Provider,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AuthUserResponse("external-1", "ana@example.com", "Ana", "google"));

        var service = new AuthService(repository.Object);

        var result = await service.LoginAsync(principal, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(ServiceCodes.AuthLoginOk, result.Code);
        Assert.Equal("Login completed successfully.", result.Message);
        Assert.Equal("ana@example.com", result.Data?.Email);
        Assert.Equal("google", result.Data?.Provider);
    }

    [Fact]
    public async Task RegisterAsync_UpdatesProfileUsingAuthenticatedExternalId()
    {
        var principal = new AuthPrincipal("external-1", "ana@example.com", "Ana", "github");
        var request = new RegisterUserRequest("Ana Maria", "ana.maria@example.com");
        var repository = new Mock<IUserRepository>();
        repository
            .Setup(repository => repository.UpsertAsync(
                principal.ExternalId,
                request.Email,
                request.DisplayName,
                principal.Provider,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AuthUserResponse("external-1", request.Email, request.DisplayName, "github"));

        var service = new AuthService(repository.Object);

        var result = await service.RegisterAsync(principal, request, CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(ServiceCodes.AuthRegistered, result.Code);
        Assert.Equal("User registered successfully.", result.Message);
        Assert.Equal("Ana Maria", result.Data?.DisplayName);
    }

    [Fact]
    public async Task RegisterAsync_ReturnsValidationError_WhenDisplayNameIsBlank()
    {
        var principal = new AuthPrincipal("external-1", "ana@example.com", "Ana", "microsoft");
        var repository = new Mock<IUserRepository>();
        var service = new AuthService(repository.Object);

        var result = await service.RegisterAsync(
            principal,
            new RegisterUserRequest(" ", "ana@example.com"),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(ServiceCodes.ValidationError, result.Code);
        Assert.Null(result.Data);
    }

    [Fact]
    public void Logout_ReturnsStandardEnvelope()
    {
        var repository = new Mock<IUserRepository>();
        var service = new AuthService(repository.Object);

        var result = service.Logout();

        Assert.True(result.IsSuccess);
        Assert.Equal(ServiceCodes.AuthLogoutOk, result.Code);
        Assert.Equal("Logout completed successfully.", result.Message);
    }
}
