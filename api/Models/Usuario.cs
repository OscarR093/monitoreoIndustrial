using System.Text.Json.Serialization;

namespace api.Models;

public class Usuario
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Rol { get; set; } = "viewer";
    public string? NombreCompleto { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public DateTime? EmailChangedAt { get; set; }
    public bool DebeCambiarInfo { get; set; } = true;
    public int? CreadoPorId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Usuario? CreadoPor { get; set; }

    [JsonIgnore]
    public ICollection<Usuario> UsuariosCreados { get; set; } = new List<Usuario>();
}
