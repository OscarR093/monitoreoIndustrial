using System.Text.Json.Serialization;

namespace api.Models;

public class ConfiguracionAlarma
{
    public int Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string ConfigJson { get; set; } = "{}";
    public bool Activo { get; set; } = false;
    public int? CreadoPorId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Usuario? CreadoPor { get; set; }
}
