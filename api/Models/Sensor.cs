namespace api.Models;

public class Sensor
{
    public int Id { get; set; }
    public int AreaId { get; set; }
    public string SensorId { get; set; } = string.Empty;
    public int Registro { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int TipoGraficoId { get; set; }
    public int UnidadId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Area Area { get; set; } = null!;
    public TipoGrafico TipoGrafico { get; set; } = null!;
    public Unidad Unidad { get; set; } = null!;
    public ICollection<DatoSensor> Datos { get; set; } = new List<DatoSensor>();
}
