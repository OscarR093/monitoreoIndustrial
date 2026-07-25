using System.Text.Json.Serialization;

namespace api.Models;

public class Sensor
{
    public int Id { get; set; }
    public int AreaId { get; set; }
    public string SensorId { get; set; } = string.Empty;
    public int Registro { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Alias { get; set; }
    public int TipoGraficoId { get; set; }
    public int UnidadId { get; set; }
    public string TipoDato { get; set; } = "analogico";
    public bool AlarmaActiva { get; set; } = false;
    public decimal? RangoMinimo { get; set; }
    public decimal? RangoMaximo { get; set; }
    public bool AlarmaEnOn { get; set; } = false;
    public bool AlarmaEnOff { get; set; } = false;
    public DateTime? UltimaAlarmaEnviada { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Area? Area { get; set; }
    [JsonIgnore]
    public TipoGrafico? TipoGrafico { get; set; }
    [JsonIgnore]
    public Unidad? Unidad { get; set; }
    [JsonIgnore]
    public ICollection<DatoSensor> Datos { get; set; } = new List<DatoSensor>();
}
