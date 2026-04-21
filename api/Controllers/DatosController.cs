using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers;

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
    public async Task<ActionResult<IEnumerable<DatoSensor>>> GetDatos(
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

        return await query
            .OrderByDescending(d => d.Timestamp)
            .Take(limit)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<DatoSensor>> CreateDato(DatoSensor dato)
    {
        _context.DatosSensores.Add(dato);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetDatos), new { id = dato.Id }, dato);
    }
}