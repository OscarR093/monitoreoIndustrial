using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UnidadesController : ControllerBase
{
    private readonly AppDbContext _context;

    public UnidadesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Unidad>>> GetUnidades()
    {
        return await _context.Unidades.ToListAsync();
    }

    [HttpPost]
    [Authorize(Policy = "AdminOrSuperAdmin")]
    public async Task<ActionResult<Unidad>> CreateUnidad(Unidad unidad)
    {
        _context.Unidades.Add(unidad);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUnidades), new { id = unidad.Id }, unidad);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOrSuperAdmin")]
    public async Task<IActionResult> UpdateUnidad(int id, Unidad update)
    {
        var unidad = await _context.Unidades.FindAsync(id);
        if (unidad == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(update.Nombre))
            unidad.Nombre = update.Nombre;
        if (!string.IsNullOrWhiteSpace(update.Simbolo))
            unidad.Simbolo = update.Simbolo;
        if (update.Descripcion != null)
            unidad.Descripcion = string.IsNullOrWhiteSpace(update.Descripcion) ? null : update.Descripcion;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOrSuperAdmin")]
    public async Task<IActionResult> DeleteUnidad(int id)
    {
        var enUso = await _context.Sensores.AnyAsync(s => s.UnidadId == id);
        if (enUso) return BadRequest("No se puede eliminar: hay sensores usando esta unidad");

        var unidad = await _context.Unidades.FindAsync(id);
        if (unidad == null) return NotFound();

        _context.Unidades.Remove(unidad);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}