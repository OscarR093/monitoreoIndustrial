using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SensoresController : ControllerBase
{
    private readonly AppDbContext _context;

    public SensoresController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<Sensor>>> GetSensores(
        [FromQuery] string? planta,
        [FromQuery] string? area)
    {
        var query = _context.Sensores
            .Include(s => s.Area)
            .ThenInclude(a => a.Planta)
            .Include(s => s.TipoGrafico)
            .Include(s => s.Unidad)
            .AsQueryable();

        if (!string.IsNullOrEmpty(area))
            query = query.Where(s => s.Area.Codigo == area);
        else if (!string.IsNullOrEmpty(planta))
            query = query.Where(s => s.Area.Planta.Codigo == planta);

        return await query.ToListAsync();
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<Sensor>> GetSensor(int id)
    {
        var sensor = await _context.Sensores
            .Include(s => s.Area)
            .ThenInclude(a => a.Planta)
            .Include(s => s.TipoGrafico)
            .Include(s => s.Unidad)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (sensor == null)
            return NotFound();
        return sensor;
    }

    [HttpPost]
    [Authorize(Policy = "AdminOrSuperAdmin")]
    public async Task<ActionResult<Sensor>> CreateSensor(Sensor sensor)
    {
        _context.Sensores.Add(sensor);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSensor), new { id = sensor.Id }, sensor);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOrSuperAdmin")]
    public async Task<IActionResult> UpdateSensor(int id, Sensor update)
    {
        var sensor = await _context.Sensores.FindAsync(id);
        if (sensor == null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(update.Alias))
            sensor.Alias = update.Alias;
        else if (update.Alias != null)
            sensor.Alias = null;

        if (!string.IsNullOrWhiteSpace(update.TipoDato))
            sensor.TipoDato = update.TipoDato;

        if (update.AlarmaEnOn && update.AlarmaEnOff)
            return BadRequest("AlarmaEnOn y AlarmaEnOff no pueden estar ambos activos al mismo tiempo");

        if (update.RangoMinimo.HasValue && update.RangoMaximo.HasValue && update.RangoMinimo >= update.RangoMaximo)
            return BadRequest("RangoMinimo debe ser menor que RangoMaximo");

        sensor.AlarmaActiva = update.AlarmaActiva;

        if (update.RangoMinimo.HasValue)
            sensor.RangoMinimo = update.RangoMinimo;
        else if (update.RangoMinimo != null)
            sensor.RangoMinimo = null;

        if (update.RangoMaximo.HasValue)
            sensor.RangoMaximo = update.RangoMaximo;
        else if (update.RangoMaximo != null)
            sensor.RangoMaximo = null;

        sensor.AlarmaEnOn = update.AlarmaEnOn;
        sensor.AlarmaEnOff = update.AlarmaEnOff;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOrSuperAdmin")]
    public async Task<IActionResult> DeleteSensor(int id)
    {
        var sensor = await _context.Sensores.FindAsync(id);
        if (sensor == null)
            return NotFound();
        _context.Sensores.Remove(sensor);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}