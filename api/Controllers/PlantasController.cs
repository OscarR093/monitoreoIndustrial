using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
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
}