using TaskManagement.Api.Auth;
using TaskManagement.Api.Dtos.Auth;
using TaskManagement.Api.Errors;
using TaskManagement.Api.Repositories;

namespace TaskManagement.Api.Services;

public sealed class AuthService : IAuthService
{
    private readonly IUserRepository _repository;

    public AuthService(IUserRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// Completes application login after an external provider has issued a valid token.
    /// </summary>
    public async Task<ServiceResponse<AuthUserResponse>> LoginAsync(
        AuthPrincipal principal,
        CancellationToken cancellationToken)
    {
        var user = await _repository.UpsertAsync(
            principal.ExternalId,
            principal.Email,
            principal.DisplayName,
            principal.Provider,
            cancellationToken);

        return ServiceResponse<AuthUserResponse>.Ok(
            user,
            ServiceCodes.AuthLoginOk,
            "Login completed successfully.");
    }

    /// <summary>
    /// Creates or updates the local application profile linked to the external identity.
    /// </summary>
    public async Task<ServiceResponse<AuthUserResponse>> RegisterAsync(
        AuthPrincipal principal,
        RegisterUserRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName))
        {
            return ServiceResponse<AuthUserResponse>.Error(ErrorCatalog.ValidationError);
        }

        var user = await _repository.UpsertAsync(
            principal.ExternalId,
            string.IsNullOrWhiteSpace(request.Email) ? principal.Email : request.Email.Trim(),
            request.DisplayName.Trim(),
            principal.Provider,
            cancellationToken);

        return ServiceResponse<AuthUserResponse>.Ok(
            user,
            ServiceCodes.AuthRegistered,
            "User registered successfully.");
    }

    /// <summary>
    /// Returns the current local profile, creating it from token claims when needed.
    /// </summary>
    public async Task<ServiceResponse<AuthUserResponse>> GetCurrentUserAsync(
        AuthPrincipal principal,
        CancellationToken cancellationToken)
    {
        var user = await _repository.GetByExternalIdAsync(principal.ExternalId, cancellationToken)
            ?? await _repository.UpsertAsync(
                principal.ExternalId,
                principal.Email,
                principal.DisplayName,
                principal.Provider,
                cancellationToken);

        return ServiceResponse<AuthUserResponse>.Ok(
            user,
            ServiceCodes.AuthUserLoaded,
            "User profile loaded successfully.");
    }

    /// <summary>
    /// Completes API-side logout acknowledgement. Token/session clearing happens in the client and identity provider.
    /// </summary>
    public ServiceResponse<object?> Logout()
    {
        return ServiceResponse<object?>.Ok(null, ServiceCodes.AuthLogoutOk, "Logout completed successfully.");
    }
}
