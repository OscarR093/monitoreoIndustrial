using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AreasController : ControllerBase
{
    private readonly AppDbContext _context;

    public AreasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Area>>> GetAreas([FromQuery] int? plantaId)
    {
        var query = _context.Areas.AsQueryable();
        if (plantaId.HasValue)
            query = query.Where(a => a.PlantaId == plantaId);
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
}