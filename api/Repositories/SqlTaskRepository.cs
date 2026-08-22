using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using TaskManagement.Api.Domain;
using TaskManagement.Api.Dtos;

namespace TaskManagement.Api.Repositories;

public sealed class SqlTaskRepository : ITaskRepository
{
    private readonly string _connectionString;

    public SqlTaskRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("TaskManagement")
            ?? configuration["SqlConnectionString"]
            ?? throw new InvalidOperationException("SQL connection string is not configured.");
    }

    public async Task<TaskItem> CreateAsync(TaskItem task, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateStoredProcedure(connection, "dbo.Task_Create");

        command.Parameters.AddWithValue("@Id", task.Id);
        command.Parameters.AddWithValue("@Title", task.Title);
        command.Parameters.AddWithValue("@Description", ToDbValue(task.Description));
        command.Parameters.AddWithValue("@DueDate", ToDbValue(task.DueDate));
        command.Parameters.AddWithValue("@Status", task.Status.ToStorageValue());
        command.Parameters.AddWithValue("@CreatedBy", task.CreatedBy);
        command.Parameters.AddWithValue("@AssignedTo", ToDbValue(task.AssignedTo));

        return await ReadSingleAsync(command, cancellationToken)
            ?? throw new InvalidOperationException("Created task was not returned by SQL.");
    }

    public async Task<TaskItem?> GetByIdAsync(Guid id, string userId, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateStoredProcedure(connection, "dbo.Task_GetById");

        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@UserId", userId);

        return await ReadSingleAsync(command, cancellationToken);
    }

    public async Task<IReadOnlyCollection<TaskItem>> ListAsync(
        string userId,
        TaskQuery query,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateStoredProcedure(connection, "dbo.Task_List");

        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@Status", ToDbValue(query.Status));
        command.Parameters.AddWithValue("@AssignedTo", ToDbValue(query.AssignedTo));
        command.Parameters.AddWithValue("@Search", ToDbValue(query.Search));
        command.Parameters.AddWithValue("@SortBy", query.SortBy);
        command.Parameters.AddWithValue("@SortDirection", query.SortDirection);
        command.Parameters.AddWithValue("@Page", query.Page);
        command.Parameters.AddWithValue("@PageSize", query.PageSize);

        var tasks = new List<TaskItem>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            tasks.Add(Map(reader));
        }

        return tasks;
    }

    public async Task<TaskItem?> UpdateAsync(
        Guid id,
        string userId,
        UpdateTaskRequest request,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateStoredProcedure(connection, "dbo.Task_Update");

        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@Title", request.Title);
        command.Parameters.AddWithValue("@Description", ToDbValue(request.Description));
        command.Parameters.AddWithValue("@DueDate", ToDbValue(request.DueDate));
        command.Parameters.AddWithValue("@Status", request.Status.ToStorageValue());
        command.Parameters.AddWithValue("@AssignedTo", ToDbValue(request.AssignedTo));

        return await ReadSingleAsync(command, cancellationToken);
    }

    public async Task<TaskItem?> UpdateStatusAsync(
        Guid id,
        string userId,
        TaskItemStatus status,
        CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateStoredProcedure(connection, "dbo.Task_UpdateStatus");

        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@UserId", userId);
        command.Parameters.AddWithValue("@Status", status.ToStorageValue());

        return await ReadSingleAsync(command, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, string userId, CancellationToken cancellationToken)
    {
        await using var connection = await OpenConnectionAsync(cancellationToken);
        await using var command = CreateStoredProcedure(connection, "dbo.Task_Delete");

        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.AddWithValue("@UserId", userId);

        var deletedCount = await command.ExecuteScalarAsync(cancellationToken);

        return Convert.ToInt32(deletedCount) > 0;
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

    private static async Task<TaskItem?> ReadSingleAsync(SqlCommand command, CancellationToken cancellationToken)
    {
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        if (!await reader.ReadAsync(cancellationToken))
        {
            return null;
        }

        return Map(reader);
    }

    private static TaskItem Map(SqlDataReader reader)
    {
        return new TaskItem(
            reader.GetGuid(reader.GetOrdinal("Id")),
            reader.GetString(reader.GetOrdinal("Title")),
            GetNullableString(reader, "Description"),
            GetNullableDateTime(reader, "DueDate"),
            TaskItemStatusMapper.FromStorageValue(reader.GetString(reader.GetOrdinal("Status"))),
            reader.GetString(reader.GetOrdinal("CreatedBy")),
            GetNullableString(reader, "AssignedTo"),
            reader.GetDateTime(reader.GetOrdinal("CreatedAt")),
            reader.GetDateTime(reader.GetOrdinal("UpdatedAt")));
    }

    private static string? GetNullableString(SqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetString(ordinal);
    }

    private static DateTime? GetNullableDateTime(SqlDataReader reader, string columnName)
    {
        var ordinal = reader.GetOrdinal(columnName);
        return reader.IsDBNull(ordinal) ? null : reader.GetDateTime(ordinal);
    }

    private static object ToDbValue<T>(T? value)
    {
        return value is null ? DBNull.Value : value;
    }
}
