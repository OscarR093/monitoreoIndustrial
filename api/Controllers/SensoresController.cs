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
    public async Task<IActionResult> UpdateSensor(int id, SensorUpdateDto update)
    {
        var sensor = await _context.Sensores
            .Include(s => s.TipoGrafico)
            .Include(s => s.Unidad)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (sensor == null)
            return NotFound();

        if (update.Alias != null)
            sensor.Alias = string.IsNullOrWhiteSpace(update.Alias) ? null : update.Alias;

        if (update.Nombre != null && !string.IsNullOrWhiteSpace(update.Nombre))
            sensor.Nombre = update.Nombre;

        if (update.UnidadId.HasValue)
            sensor.UnidadId = update.UnidadId.Value;

        if (update.TipoGraficoId.HasValue)
            sensor.TipoGraficoId = update.TipoGraficoId.Value;

        if (update.TipoDato != null)
            sensor.TipoDato = update.TipoDato;

        if (update.ModoDigital != null)
            sensor.ModoDigital = update.ModoDigital;

        var tipo = sensor.TipoDato;
        var modo = sensor.ModoDigital;

        if (tipo == "digital" && modo != null && modo != "estado" && modo != "contador")
            return BadRequest("ModoDigital debe ser 'estado' o 'contador' para sensores digitales");

        if (tipo == "analogico" && modo != null)
            return BadRequest("ModoDigital debe ser null para sensores analógicos");

        if (tipo == "digital" && modo == null)
            sensor.ModoDigital = "estado";

        if (modo == "contador")
        {
            if (update.AlarmaEnOn == true || update.AlarmaEnOff == true)
                return BadRequest("Sensores contador no pueden usar AlarmaEnOn/AlarmaEnOff. Use RangoMinimo/RangoMaximo.");
            sensor.AlarmaEnOn = false;
            sensor.AlarmaEnOff = false;
        }
        else if (modo == "estado")
        {
            if (update.RangoMinimo != null || update.RangoMaximo != null)
                return BadRequest("Sensores de estado no pueden usar RangoMinimo/RangoMaximo. Use AlarmaEnOn/AlarmaEnOff.");
            sensor.RangoMinimo = null;
            sensor.RangoMaximo = null;
        }

        if (update.AlarmaEnOn == true && update.AlarmaEnOff == true)
            return BadRequest("AlarmaEnOn y AlarmaEnOff no pueden estar ambos activos al mismo tiempo");

        if (update.RangoMinimo != null && update.RangoMaximo != null && update.RangoMinimo >= update.RangoMaximo)
            return BadRequest("RangoMinimo debe ser menor que RangoMaximo");

        if (update.AlarmaActiva.HasValue)
            sensor.AlarmaActiva = update.AlarmaActiva.Value;

        if (update.AlarmaEnOn.HasValue)
            sensor.AlarmaEnOn = update.AlarmaEnOn.Value;

        if (update.AlarmaEnOff.HasValue)
            sensor.AlarmaEnOff = update.AlarmaEnOff.Value;

        if (update.RangoMinimo != null)
            sensor.RangoMinimo = update.RangoMinimo;

        if (update.RangoMaximo != null)
            sensor.RangoMaximo = update.RangoMaximo;

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