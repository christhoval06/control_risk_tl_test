using TaskManagement.Api.Dtos.Auth;

namespace TaskManagement.Api.Repositories;

public interface IUserRepository
{
    Task<AuthUserResponse> UpsertAsync(
        string externalId,
        string? email,
        string? displayName,
        string provider,
        CancellationToken cancellationToken);

    Task<AuthUserResponse?> GetByExternalIdAsync(string externalId, CancellationToken cancellationToken);
}
