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
    public async Task<ActionResult<Sensor>> CreateSensor(Sensor sensor)
    {
        _context.Sensores.Add(sensor);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSensor), new { id = sensor.Id }, sensor);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSensor(int id, Sensor sensor)
    {
        if (id != sensor.Id)
            return BadRequest();
        _context.Entry(sensor).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
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