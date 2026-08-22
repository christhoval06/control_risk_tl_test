using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using TaskManagement.Api.Dtos.Auth;

namespace TaskManagement.Api.Repositories;

public sealed class SqlUserRepository : IUserRepository
{
    private readonly string _connectionString;

    public SqlUserRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("TaskManagement")
            ?? configuration["SqlConnectionString"]
            ?? throw new InvalidOperationException("SQL connection string is not configured.");
    }

    public async Task<AuthUserResponse> UpsertAsync(
        string externalId,
        string? email,
        string? displayName,
        string provider,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateStoredProcedure(connection, "dbo.User_Upsert");

        command.Parameters.AddWithValue("@ExternalId", externalId);
        command.Parameters.AddWithValue("@Email", ToDbValue(email));
        command.Parameters.AddWithValue("@DisplayName", ToDbValue(displayName));
        command.Parameters.AddWithValue("@Provider", provider);

        return await ReadSingleAsync(command, cancellationToken)
            ?? throw new InvalidOperationException("Upserted user was not returned by SQL.");
    }

    public async Task<AuthUserResponse?> GetByExternalIdAsync(string externalId, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateStoredProcedure(connection, "dbo.User_GetByExternalId");

        command.Parameters.AddWithValue("@ExternalId", externalId);

        return await ReadSingleAsync(command, cancellationToken);
    }

    private async Task<SqlConnection> OpenConnectionAsync(CancellationToken cancellationToken)
    {
        var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync(cancellationToken);

        return connection;
    }

    private static SqlCommand CreateStoredProcedure(SqlConnection connection, string procedureName)
    {
        return new SqlCommand(procedureName, connection)
        {
            CommandType = CommandType.StoredProcedure
        };
    }

    private static async Task<AuthUserResponse?> ReadSingleAsync(SqlCommand command, CancellationToken cancellationToken)
    {
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return new AuthUserResponse(
            reader.GetString(reader.GetOrdinal("ExternalId")),
            GetNullableString(reader, "Email"),
            GetNullableString(reader, "DisplayName"),
            reader.GetString(reader.GetOrdinal("Provider")));
    }

    private static string? GetNullableString(SqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    private static object ToDbValue<T>(T? value)
    {
        return value is null ? DBNull.Value : value;
    }
}
