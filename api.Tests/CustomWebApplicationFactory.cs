using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using api.Services;

namespace api.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public CustomWebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("INTEGRATION_TEST", "true");
        Environment.SetEnvironmentVariable("JWT_SECRET", "test-secret-key-with-at-least-32-chars!!");
        Environment.SetEnvironmentVariable("JWT_EXPIRES_IN", "1h");
        Environment.SetEnvironmentVariable("SUPER_ADMIN_USERNAME", "admin");
        Environment.SetEnvironmentVariable("SUPER_ADMIN_PASSWORD", "admin123");
        Environment.SetEnvironmentVariable("DEPLOYMENT_MODE", "intranet");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IHostedService>();
            services.RemoveAll<WebSocketRealtimeService>();
        });
    }
}
