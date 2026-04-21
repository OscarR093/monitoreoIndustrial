namespace api.Models;

public class TipoGrafico
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Widget { get; set; } = string.Empty;

    public ICollection<Sensor> Sensores { get; set; } = new List<Sensor>();
}
