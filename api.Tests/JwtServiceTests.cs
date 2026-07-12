using System.Security.Claims;
using api.Models;
using api.Services;
using Xunit;

namespace api.Tests;

public class JwtServiceTests
{
    [Fact]
    public void GenerateToken_ReturnsValidToken()
    {
        Environment.SetEnvironmentVariable("JWT_SECRET", "test-key-with-minimum-32-chars!!");
        Environment.SetEnvironmentVariable("JWT_EXPIRES_IN", "1h");
        var service = new JwtService();

        var usuario = new Usuario
        {
            Id = 1,
            Username = "testuser",
            Rol = "admin",
            DebeCambiarInfo = false,
        };

        var (token, expiresAt) = service.GenerateToken(usuario);

        Assert.NotNull(token);
        Assert.NotEmpty(token);
        Assert.True(expiresAt > DateTime.UtcNow);
    }

    [Fact]
    public void ValidateToken_ValidToken_ReturnsPrincipal()
    {
        Environment.SetEnvironmentVariable("JWT_SECRET", "test-key-with-minimum-32-chars!!");
        Environment.SetEnvironmentVariable("JWT_EXPIRES_IN", "1h");
        var service = new JwtService();

        var usuario = new Usuario
        {
            Id = 42,
            Username = "validuser",
            Rol = "superadmin",
            DebeCambiarInfo = true,
        };

        var (token, _) = service.GenerateToken(usuario);
        var principal = service.ValidateToken(token);

        Assert.NotNull(principal);
        Assert.Equal("42", principal.FindFirstValue(ClaimTypes.NameIdentifier));
        Assert.Equal("validuser", principal.FindFirstValue(ClaimTypes.Name));
        Assert.Equal("superadmin", principal.FindFirstValue(ClaimTypes.Role));
        Assert.Equal("true", principal.FindFirstValue("mustUpdateProfile"));
    }

    [Fact]
    public void ValidateToken_InvalidToken_ReturnsNull()
    {
        Environment.SetEnvironmentVariable("JWT_SECRET", "test-key-with-minimum-32-chars!!");
        Environment.SetEnvironmentVariable("JWT_EXPIRES_IN", "1h");
        var service = new JwtService();

        var principal = service.ValidateToken("invalid.token.here");

        Assert.Null(principal);
    }

    [Fact]
    public void ValidateToken_ExpiredToken_ReturnsNull()
    {
        Environment.SetEnvironmentVariable("JWT_SECRET", "test-key-with-minimum-32-chars!!");
        Environment.SetEnvironmentVariable("JWT_EXPIRES_IN", "1s");
        var service = new JwtService();

        var usuario = new Usuario { Id = 1, Username = "x", Rol = "viewer" };
        var (token, _) = service.GenerateToken(usuario);

        Thread.Sleep(3000);

        var principal = service.ValidateToken(token);
        Assert.Null(principal);
    }

    [Fact]
    public void GenerateToken_IncludesAllClaims()
    {
        Environment.SetEnvironmentVariable("JWT_SECRET", "test-key-with-minimum-32-chars!!");
        var service = new JwtService();

        var usuario = new Usuario
        {
            Id = 99,
            Username = "claimsuser",
            Rol = "viewer",
            DebeCambiarInfo = true,
        };

        var (token, _) = service.GenerateToken(usuario);
        var principal = service.ValidateToken(token)!;

        Assert.NotNull(principal);
        var claims = principal.Claims.ToDictionary(c => c.Type, c => c.Value);
        Assert.Equal("99", claims[ClaimTypes.NameIdentifier]);
        Assert.Equal("claimsuser", claims[ClaimTypes.Name]);
        Assert.Equal("viewer", claims[ClaimTypes.Role]);
        Assert.Equal("true", claims["mustUpdateProfile"]);
    }

    [Fact]
    public void Constructor_WithoutSecret_Throws()
    {
        Environment.SetEnvironmentVariable("JWT_SECRET", null!);
        Assert.Throws<InvalidOperationException>(() => new JwtService());
    }
}
