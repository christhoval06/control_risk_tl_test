using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using StackExchange.Redis;
using TaskManagement.Api.Auth;
using TaskManagement.Api.Factories;
using TaskManagement.Api.Repositories;
using TaskManagement.Api.Services;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices((context, services) =>
    {
        services.AddSingleton<IConfiguration>(context.Configuration);
        services.AddSingleton<IJwtPrincipalReader, JwtPrincipalReader>();
        services.AddScoped<ITaskFactory, TaskManagement.Api.Factories.TaskFactory>();
        services.AddScoped<IUserRepository, SqlUserRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITaskRepository, SqlTaskRepository>();
        services.AddSingleton<ITaskStatusEventPublisher, InMemoryTaskStatusEventPublisher>();
        services.AddSingleton<ICacheService>(serviceProvider =>
        {
            var configuration = serviceProvider.GetRequiredService<IConfiguration>();
            var cacheEnabled = configuration.GetValue("Cache:Enabled", false);
            var redisConnectionString = configuration["Redis:ConnectionString"];

            if (!cacheEnabled || string.IsNullOrWhiteSpace(redisConnectionString))
            {
                return new NullCacheService();
            }

            var ttlSeconds = configuration.GetValue("Cache:DefaultTtlSeconds", 60);
            var redisOptions = ConfigurationOptions.Parse(redisConnectionString);
            redisOptions.AbortOnConnectFail = false;
            var connection = ConnectionMultiplexer.Connect(redisOptions);

            return new RedisCacheService(connection, TimeSpan.FromSeconds(Math.Max(1, ttlSeconds)));
        });
        services.AddScoped<ITaskService, TaskService>();
    })
    .Build();

host.Run();
