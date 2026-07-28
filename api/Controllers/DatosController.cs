using Microsoft.AspNetCore.Authorization;
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
[Authorize]
public class DatosController : ControllerBase
{
    private readonly AppDbContext _context;

    public DatosController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetDatos(
        [FromQuery] int? sensorId,
        [FromQuery] string? planta,
        [FromQuery] string? area,
        [FromQuery] long? from,
        [FromQuery] long? to,
        [FromQuery] int limit = 100,
        [FromQuery] string? agregar = null)
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
        if (from.HasValue)
            query = query.Where(d => d.Timestamp >= from.Value);
        if (to.HasValue)
            query = query.Where(d => d.Timestamp <= to.Value);

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

        if (agregar == "diario" && sensorId.HasValue)
        {
            var sensor = await _context.Sensores.FindAsync(sensorId.Value);
            if (sensor?.ModoDigital == "contador")
            {
                var rawData = await _context.DatosSensores
                    .Where(d => d.SensorId == sensorId.Value)
                    .Where(d => d.Timestamp >= (from ?? 0) && d.Timestamp <= (to ?? long.MaxValue))
                    .ToListAsync();

                var diario = rawData
                    .GroupBy(d => DateTimeOffset.FromUnixTimeSeconds(d.Timestamp).Date)
                    .Select(g => new { Dia = g.Key.ToString("yyyy-MM-dd"), Total = g.Sum(d => d.Cambios) })
                    .OrderBy(g => g.Dia)
                    .ToList();

                return Ok(new { raw = result, diario = diario.Select(d => new { dia = d.Dia, total = d.Total }) });
            }
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<DatoSensor>> CreateDato(DatoSensor dato)
    {
        _context.DatosSensores.Add(dato);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetDatos), new { id = dato.Id }, dato);
    }
}