namespace api.Models;

public class Unidad
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Simbolo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    public ICollection<Sensor> Sensores { get; set; } = new List<Sensor>();
}