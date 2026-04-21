using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers;

public class DatoSensorDto
{
    public int Id { get; set; }
    public int SensorId { get; set; }
    public decimal Valor { get; set; }
    public long Timestamp { get; set; }
    public DateTime CreatedAt { get; set; }
    public SensorDto? Sensor { get; set; }
}

public class SensorDto
{
    public int Id { get; set; }
    public string SensorId { get; set; } = "";
    public string Nombre { get; set; } = "";
}

[ApiController]
[Route("api/[controller]")]
public class DatosController : ControllerBase
{
    private readonly AppDbContext _context;

    public DatosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<DatoSensorDto>>> GetDatos(
        [FromQuery] int? sensorId,
        [FromQuery] string? planta,
        [FromQuery] string? area,
        [FromQuery] int limit = 100)
    {
        var query = _context.DatosSensores
            .Include(d => d.Sensor)
            .ThenInclude(s => s!.Area)
            .AsQueryable();

        if (sensorId.HasValue)
            query = query.Where(d => d.SensorId == sensorId);
        if (!string.IsNullOrEmpty(planta))
            query = query.Where(d => d.Sensor!.Area.Planta.Codigo == planta);
        if (!string.IsNullOrEmpty(area))
            query = query.Where(d => d.Sensor!.Area.Codigo == area);

        var datos = await query
            .OrderByDescending(d => d.Timestamp)
            .Take(limit)
            .ToListAsync();

        var result = datos.Select(d => new DatoSensorDto
        {
            Id = d.Id,
            SensorId = d.SensorId,
            Valor = d.Valor,
            Timestamp = d.Timestamp,
            CreatedAt = d.CreatedAt,
            Sensor = d.Sensor != null ? new SensorDto
            {
                Id = d.Sensor.Id,
                SensorId = d.Sensor.SensorId,
                Nombre = d.Sensor.Nombre
            } : null
        }).ToList();

        return result;
    }

    [HttpPost]
    public async Task<ActionResult<DatoSensor>> CreateDato(DatoSensor dato)
    {
        _context.DatosSensores.Add(dato);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetDatos), new { id = dato.Id }, dato);
    }
}