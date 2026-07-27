using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;
using api.Services;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;
    private readonly EmailService _emailService;

    public AuthController(AppDbContext context, JwtService jwtService, EmailService emailService)
    {
        _context = context;
        _jwtService = jwtService;
        _emailService = emailService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            return Unauthorized(new { message = "Credenciales inválidas" });

        var (token, expiresAt) = _jwtService.GenerateToken(usuario);

        var isCloud = Environment.GetEnvironmentVariable("DEPLOYMENT_MODE") == "cloud";

        Response.Cookies.Append("jwt", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = isCloud,
            SameSite = SameSiteMode.Strict,
            Expires = expiresAt,
            Path = "/",
        });

        return Ok(new LoginResponse
        {
            Id = usuario.Id,
            Username = usuario.Username,
            Rol = usuario.Rol,
            MustUpdateProfile = usuario.DebeCambiarInfo,
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
    {
        Response.Cookies.Append("jwt", "", new CookieOptions
        {
            HttpOnly = true,
            Secure = Environment.GetEnvironmentVariable("DEPLOYMENT_MODE") == "cloud",
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(-1),
            Path = "/",
        });

        return Ok(new { message = "Sesión cerrada" });
    }

    [HttpPost("register")]
    [Authorize(Policy = "AdminOrSuperAdmin")]
    public async Task<ActionResult<UsuarioDto>> Register([FromBody] RegisterRequest request)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var currentUserRol = User.FindFirstValue(ClaimTypes.Role)!;

        if (request.Rol != "admin" && request.Rol != "viewer")
            return BadRequest(new { message = "Rol inválido. Debe ser 'admin' o 'viewer'" });

        if (request.Rol == "admin" && currentUserRol != "superadmin")
            return Forbid();

        if (await _context.Usuarios.AnyAsync(u => u.Username == request.Username))
            return Conflict(new { message = "El nombre de usuario ya existe" });

        var usuario = new Usuario
        {
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.TempPassword),
            Rol = request.Rol,
            DebeCambiarInfo = true,
            CreadoPorId = currentUserId,
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMe), null, new UsuarioDto
        {
            Id = usuario.Id,
            Username = usuario.Username,
            Rol = usuario.Rol,
            NombreCompleto = usuario.NombreCompleto,
            Email = usuario.Email,
            Telefono = usuario.Telefono,
            DebeCambiarInfo = usuario.DebeCambiarInfo,
            CreadoPorId = usuario.CreadoPorId,
            CreatedAt = usuario.CreatedAt,
        });
    }

    [HttpPut("complete-profile")]
    [Authorize]
    public async Task<IActionResult> CompleteProfile([FromBody] CompleteProfileRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var usuario = await _context.Usuarios.FindAsync(userId);

        if (usuario == null)
            return NotFound();

        if (!usuario.DebeCambiarInfo)
            return BadRequest(new { message = "El perfil ya fue completado" });

        usuario.NombreCompleto = request.NombreCompleto;
        usuario.Email = request.Email;
        usuario.Telefono = request.Telefono;
        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaPassword);
        usuario.DebeCambiarInfo = false;
        usuario.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var (token, expiresAt) = _jwtService.GenerateToken(usuario);

        var isCloud = Environment.GetEnvironmentVariable("DEPLOYMENT_MODE") == "cloud";
        Response.Cookies.Append("jwt", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = isCloud,
            SameSite = SameSiteMode.Strict,
            Expires = expiresAt,
            Path = "/",
        });

        return Ok(new { message = "Perfil completado exitosamente" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UsuarioDto>> GetMe()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var usuario = await _context.Usuarios.FindAsync(userId);

        if (usuario == null)
            return NotFound();

        return Ok(new UsuarioDto
        {
            Id = usuario.Id,
            Username = usuario.Username,
            Rol = usuario.Rol,
            NombreCompleto = usuario.NombreCompleto,
            Email = usuario.Email,
            Telefono = usuario.Telefono,
            DebeCambiarInfo = usuario.DebeCambiarInfo,
            CreadoPorId = usuario.CreadoPorId,
            CreatedAt = usuario.CreatedAt,
        });
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var usuario = await _context.Usuarios.FindAsync(userId);

        if (usuario == null)
            return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, usuario.PasswordHash))
            return Unauthorized(new { message = "Contraseña actual incorrecta" });

        if (!string.IsNullOrEmpty(request.NombreCompleto))
            usuario.NombreCompleto = request.NombreCompleto;

        if (request.Email != null)
        {
            var oldEmail = usuario.Email;
            if (!string.IsNullOrWhiteSpace(request.Email))
                usuario.Email = request.Email;
            else
                usuario.Email = null;
            if (usuario.Email != oldEmail)
                usuario.EmailChangedAt = DateTime.UtcNow;
        }

        if (request.Telefono != null)
            usuario.Telefono = string.IsNullOrWhiteSpace(request.Telefono) ? null : request.Telefono;

        usuario.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Perfil actualizado" });
    }

    [HttpDelete("me")]
    [Authorize]
    public async Task<IActionResult> DeleteMe()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var currentUserRol = User.FindFirstValue(ClaimTypes.Role)!;

        if (currentUserRol == "superadmin")
            return Forbid();

        var usuario = await _context.Usuarios
            .Include(u => u.UsuariosCreados)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (usuario == null)
            return NotFound();

        foreach (var creado in usuario.UsuariosCreados)
        {
            creado.CreadoPorId = null;
        }

        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();

        Response.Cookies.Append("jwt", "", new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(-1),
            Path = "/",
        });

        return Ok(new { message = "Cuenta eliminada" });
    }

    [HttpGet("users")]
    [Authorize(Policy = "AdminOrSuperAdmin")]
    public async Task<ActionResult<IEnumerable<UsuarioDto>>> GetUsers()
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var currentUserRol = User.FindFirstValue(ClaimTypes.Role)!;

        IQueryable<Usuario> query = _context.Usuarios;

        if (currentUserRol == "admin")
            query = query.Where(u => u.CreadoPorId == currentUserId);

        var usuarios = await query
            .OrderBy(u => u.CreatedAt)
            .ToListAsync();

        return Ok(usuarios.Select(u => new UsuarioDto
        {
            Id = u.Id,
            Username = u.Username,
            Rol = u.Rol,
            NombreCompleto = u.NombreCompleto,
            Email = u.Email,
            Telefono = u.Telefono,
            DebeCambiarInfo = u.DebeCambiarInfo,
            CreadoPorId = u.CreadoPorId,
            CreatedAt = u.CreatedAt,
        }));
    }

    [HttpDelete("users/{id}")]
    [Authorize(Policy = "AdminOrSuperAdmin")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var currentUserRol = User.FindFirstValue(ClaimTypes.Role)!;

        if (id == currentUserId)
            return BadRequest(new { message = "Usa DELETE /api/auth/me para eliminar tu propia cuenta" });

        var targetUser = await _context.Usuarios
            .Include(u => u.UsuariosCreados)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (targetUser == null)
            return NotFound();

        if (currentUserRol == "admin")
        {
            if (targetUser.Rol != "viewer")
                return Forbid();
            if (targetUser.CreadoPorId != currentUserId)
                return Forbid();
        }

        foreach (var creado in targetUser.UsuariosCreados)
        {
            creado.CreadoPorId = null;
        }

        _context.Usuarios.Remove(targetUser);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Usuario eliminado" });
    }

    [HttpPost("send-pin")]
    [Authorize]
    public async Task<ActionResult<SendPinResponse>> SendPin([FromBody] SendPinRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, usuario.PasswordHash))
            return Unauthorized(new { message = "Contraseña actual incorrecta" });

        if (usuario.EmailChangedAt.HasValue && DateTime.UtcNow - usuario.EmailChangedAt.Value < TimeSpan.FromMinutes(5))
            return BadRequest(new { message = "El email fue cambiado recientemente. Espera 5 minutos antes de solicitar un PIN." });

        var pin = new Random().Next(100000, 999999).ToString();
        var expiraEn = DateTime.UtcNow.AddMinutes(5);

        _context.Set<PinVerification>().Add(new PinVerification
        {
            UsuarioId = userId,
            Pin = pin,
            ExpiraEn = expiraEn,
        });
        await _context.SaveChangesAsync();

        var emailSent = false;
        if (!string.IsNullOrEmpty(usuario.Email) && _emailService.IsEnabled)
        {
            await _emailService.SendPinAsync(usuario.Email, pin);
            emailSent = true;
        }

        return Ok(new SendPinResponse
        {
            EmailSent = emailSent,
            Pin = _emailService.IsEnabled ? null : pin,
        });
    }

    [HttpPost("verify-pin")]
    [Authorize]
    public async Task<IActionResult> VerifyPin([FromBody] VerifyPinRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var verificacion = await _context.Set<PinVerification>()
            .Where(p => p.UsuarioId == userId && !p.Usado && p.ExpiraEn > DateTime.UtcNow)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        if (verificacion == null || verificacion.Pin != request.Pin)
            return BadRequest(new { message = "PIN inválido o expirado" });

        verificacion.Usado = true;

        var usuario = await _context.Usuarios.FindAsync(userId);
        if (usuario == null) return NotFound();
        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        usuario.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Contraseña actualizada" });
    }
}
