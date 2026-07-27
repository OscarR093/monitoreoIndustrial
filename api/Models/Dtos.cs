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
    public string CurrentPassword { get; set; } = string.Empty;
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

public class SensorUpdateDto
{
    public string? Alias { get; set; }
    public string? Nombre { get; set; }
    public string? TipoDato { get; set; }
    public string? ModoDigital { get; set; }
    public int? UnidadId { get; set; }
    public int? TipoGraficoId { get; set; }
    public bool? AlarmaActiva { get; set; }
    public decimal? RangoMinimo { get; set; }
    public decimal? RangoMaximo { get; set; }
    public bool? AlarmaEnOn { get; set; }
    public bool? AlarmaEnOff { get; set; }
}

public class AreaUpdateDto
{
    public string? Nombre { get; set; }
    public string? Alias { get; set; }
}

public class SendPinRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
}

public class SendPinResponse
{
    public bool EmailSent { get; set; }
    public string? Pin { get; set; }
}

public class VerifyPinRequest
{
    public string Pin { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
