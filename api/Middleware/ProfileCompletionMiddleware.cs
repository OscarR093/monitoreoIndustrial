using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using api.Data;

namespace api.Middleware;

public class ProfileCompletionMiddleware
{
    private readonly RequestDelegate _next;

    public ProfileCompletionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var mustUpdateClaim = context.User.FindFirst("mustUpdateProfile")?.Value;
            if (mustUpdateClaim == "true")
            {
                var path = context.Request.Path.Value ?? "";
                if (!path.StartsWith("/api/auth/complete-profile", StringComparison.OrdinalIgnoreCase) &&
                    !path.StartsWith("/api/auth/logout", StringComparison.OrdinalIgnoreCase) &&
                    !path.StartsWith("/api/auth/me", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = 403;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(
                        "{\"message\":\"Debe completar su perfil antes de acceder al sistema\",\"mustUpdateProfile\":true}");
                    return;
                }
            }
        }

        await _next(context);
    }
}
