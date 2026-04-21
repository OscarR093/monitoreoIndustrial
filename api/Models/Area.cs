using System.Text.Json.Serialization;

namespace api.Models;

public class Area
{
    public int Id { get; set; }
    public int PlantaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Planta Planta { get; set; } = null!;
    [JsonIgnore]
    public ICollection<Sensor> Sensores { get; set; } = new List<Sensor>();
}
