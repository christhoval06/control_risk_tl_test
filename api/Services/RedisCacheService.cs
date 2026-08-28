using System.Text.Json;
using StackExchange.Redis;
using TaskManagement.Api.Functions;

namespace TaskManagement.Api.Services;

public sealed class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _connection;
    private readonly TimeSpan _defaultTtl;

    public RedisCacheService(IConnectionMultiplexer connection, TimeSpan defaultTtl)
    {
        _connection = connection;
        _defaultTtl = defaultTtl;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken)
    {
        try
        {
            var value = await _connection.GetDatabase().StringGetAsync(key);

            return value.HasValue
                ? JsonSerializer.Deserialize<T>(value.ToString(), ApiJsonOptions.SerializerOptions)
                : default;
        }
        catch (RedisException)
        {
            return default;
        }
        catch (JsonException)
        {
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, CancellationToken cancellationToken)
    {
        try
        {
            var json = JsonSerializer.Serialize(value, ApiJsonOptions.SerializerOptions);
            await _connection.GetDatabase().StringSetAsync(key, json, _defaultTtl);
        }
        catch (RedisException)
        {
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken)
    {
        try
        {
            await _connection.GetDatabase().KeyDeleteAsync(key);
        }
        catch (RedisException)
        {
        }
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken)
    {
        try
        {
            foreach (var endpoint in _connection.GetEndPoints())
            {
                var server = _connection.GetServer(endpoint);
                await foreach (var key in server.KeysAsync(pattern: $"{prefix}*"))
                {
                    await _connection.GetDatabase().KeyDeleteAsync(key);
                }
            }
        }
        catch (RedisException)
        {
        }
    }
}
