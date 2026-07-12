namespace api.Models;

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponse
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public bool MustUpdateProfile { get; set; }
}

public class RegisterRequest
{
    public string Username { get; set; } = string.Empty;
    public string TempPassword { get; set; } = string.Empty;
    public string Rol { get; set; } = "viewer";
}

public class CompleteProfileRequest
{
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string NuevaPassword { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    public string? NombreCompleto { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public string? NuevaPassword { get; set; }
}

public class UsuarioDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Rol { get; set; } = string.Empty;
    public string? NombreCompleto { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public bool DebeCambiarInfo { get; set; }
    public int? CreadoPorId { get; set; }
    public DateTime CreatedAt { get; set; }
}
