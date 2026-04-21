namespace api.Models;

public class Area
{
    public int Id { get; set; }
    public int PlantaId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Planta Planta { get; set; } = null!;
    public ICollection<Sensor> Sensores { get; set; } = new List<Sensor>();
}
