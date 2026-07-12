using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using api.Models;

namespace api.Services;

public class JwtService
{
    private readonly string _secret;
    private readonly string _expiresIn;

    public JwtService()
    {
        _secret = Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? throw new InvalidOperationException("JWT_SECRET environment variable is required");
        _expiresIn = Environment.GetEnvironmentVariable("JWT_EXPIRES_IN") ?? "1h";
    }

    public (string token, DateTime expiresAt) GenerateToken(Usuario usuario)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new Claim(ClaimTypes.Name, usuario.Username),
            new Claim(ClaimTypes.Role, usuario.Rol),
            new Claim("mustUpdateProfile", usuario.DebeCambiarInfo.ToString().ToLower()),
        };

        var expiresAt = DateTime.UtcNow.Add(
            _expiresIn.EndsWith("h") ? TimeSpan.FromHours(int.Parse(_expiresIn.TrimEnd('h')))
            : _expiresIn.EndsWith("m") ? TimeSpan.FromMinutes(int.Parse(_expiresIn.TrimEnd('m')))
            : _expiresIn.EndsWith("s") ? TimeSpan.FromSeconds(int.Parse(_expiresIn.TrimEnd('s')))
            : TimeSpan.FromHours(1));

        var token = new JwtSecurityToken(
            issuer: "monitoreo-industrial",
            audience: "monitoreo-industrial",
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = "monitoreo-industrial",
                ValidateAudience = true,
                ValidAudience = "monitoreo-industrial",
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero,
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
