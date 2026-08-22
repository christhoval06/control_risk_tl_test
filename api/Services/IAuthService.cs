using TaskManagement.Api.Auth;
using TaskManagement.Api.Dtos.Auth;

namespace TaskManagement.Api.Services;

public interface IAuthService
{
    Task<ServiceResponse<AuthUserResponse>> LoginAsync(AuthPrincipal principal, CancellationToken cancellationToken);

    Task<ServiceResponse<AuthUserResponse>> RegisterAsync(
        AuthPrincipal principal,
        RegisterUserRequest request,
        CancellationToken cancellationToken);

    Task<ServiceResponse<AuthUserResponse>> GetCurrentUserAsync(
        AuthPrincipal principal,
        CancellationToken cancellationToken);

    ServiceResponse<object?> Logout();
}
