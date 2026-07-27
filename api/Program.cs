using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using api.Data;
using api.Middleware;
using api.Models;
using api.Services;

Env.Load("../.env");

var builder = WebApplication.CreateBuilder(args);

var isIntegrationTest = Environment.GetEnvironmentVariable("INTEGRATION_TEST") == "true";

if (isIntegrationTest)
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseInMemoryDatabase("TestDb"));
}
else
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Host=localhost;Port=5432;Database=monitoreoindustrial;Username=admin;Password=monitoreo123";

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(connectionString));
}

var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? throw new InvalidOperationException("JWT_SECRET environment variable is required");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = "monitoreo-industrial",
        ValidateAudience = true,
        ValidAudience = "monitoreo-industrial",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            context.Token = context.Request.Cookies["jwt"];
            return Task.CompletedTask;
        },
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOrSuperAdmin", policy =>
        policy.RequireRole("admin", "superadmin"));
    options.AddPolicy("SuperAdminOnly", policy =>
        policy.RequireRole("superadmin"));
});

builder.Services.AddSingleton<JwtService>();
builder.Services.AddSingleton<WebSocketRealtimeService>();
builder.Services.AddScoped<AlarmService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddHttpClient("TelegramBot");
builder.Services.AddHttpClient("Resend");
builder.Services.AddHostedService<MqttSubscriberService>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

var deploymentMode = Environment.GetEnvironmentVariable("DEPLOYMENT_MODE") ?? "intranet";
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
    if (deploymentMode == "cloud")
    {
        var allowedOrigin = Environment.GetEnvironmentVariable("DOMAIN_URL");
        if (!string.IsNullOrEmpty(allowedOrigin))
            policy.WithOrigins($"https://{allowedOrigin}")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
    }
    else
    {
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    }
    });
});

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<ProfileCompletionMiddleware>();
app.UseWebSockets();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.EnsureCreatedAsync();

    var superAdminUsername = Environment.GetEnvironmentVariable("SUPER_ADMIN_USERNAME") ?? "admin";
    var superAdminPassword = Environment.GetEnvironmentVariable("SUPER_ADMIN_PASSWORD") ?? "admin123";

    var existeSuperAdmin = await dbContext.Usuarios
        .AnyAsync(u => u.Rol == "superadmin");

    if (!existeSuperAdmin)
    {
        dbContext.Usuarios.Add(new Usuario
        {
            Username = superAdminUsername,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(superAdminPassword),
            Rol = "superadmin",
            DebeCambiarInfo = false,
            NombreCompleto = "Super Administrador",
        });
        await dbContext.SaveChangesAsync();
    }
}

if (Environment.GetEnvironmentVariable("INTEGRATION_TEST") != "true")
{
    var wsService = app.Services.GetRequiredService<WebSocketRealtimeService>();
    await wsService.InitializeAsync();
}

app.MapControllers();

app.Run();
