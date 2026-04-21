using System.Text.Json.Serialization;

namespace api.Models;

public class DatoSensor
{
    public int Id { get; set; }
    public int SensorId { get; set; }
    public decimal Valor { get; set; }
    public long Timestamp { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Sensor Sensor { get; set; } = null!;
}
