using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AreasController : ControllerBase
{
    private readonly AppDbContext _context;

    public AreasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Area>>> GetAreas(
        [FromQuery] int? plantaId,
        [FromQuery] string? planta)
    {
        var query = _context.Areas
            .Include(a => a.Planta)
            .AsQueryable();
        if (plantaId.HasValue)
            query = query.Where(a => a.PlantaId == plantaId);
        if (!string.IsNullOrEmpty(planta))
            query = query.Where(a => a.Planta.Codigo == planta);
        return await query.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Area>> GetArea(int id)
    {
        var area = await _context.Areas.FindAsync(id);
        if (area == null)
            return NotFound();
        return area;
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOrSuperAdmin")]
    public async Task<IActionResult> UpdateArea(int id, AreaUpdateDto update)
    {
        var area = await _context.Areas.FindAsync(id);
        if (area == null)
            return NotFound();

        if (update.Nombre != null && !string.IsNullOrWhiteSpace(update.Nombre))
            area.Nombre = update.Nombre;

        if (update.Alias != null)
            area.Alias = string.IsNullOrWhiteSpace(update.Alias) ? null : update.Alias;

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
