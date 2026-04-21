using System.Text.Json.Serialization;

namespace api.Models;

public class Planta
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public ICollection<Area> Areas { get; set; } = new List<Area>();
}
