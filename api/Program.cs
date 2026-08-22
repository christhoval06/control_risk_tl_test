using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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
        services.AddScoped<ITaskService, TaskService>();
    })
    .Build();

host.Run();
