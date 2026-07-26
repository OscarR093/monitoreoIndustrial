using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PlantasController : ControllerBase
{
    private readonly AppDbContext _context;

    public PlantasController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Planta>>> GetPlantas()
    {
        return await _context.Plantas.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Planta>> GetPlanta(int id)
    {
        var planta = await _context.Plantas.FindAsync(id);
        if (planta == null)
            return NotFound();
        return planta;
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOrSuperAdmin")]
    public async Task<IActionResult> UpdatePlanta(int id, AreaUpdateDto update)
    {
        var planta = await _context.Plantas.FindAsync(id);
        if (planta == null)
            return NotFound();

        if (update.Nombre != null && !string.IsNullOrWhiteSpace(update.Nombre))
            planta.Nombre = update.Nombre;

        if (update.Alias != null)
            planta.Alias = string.IsNullOrWhiteSpace(update.Alias) ? null : update.Alias;

        await _context.SaveChangesAsync();
        return NoContent();
    }
}