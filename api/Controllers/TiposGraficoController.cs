using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/tipos-grafico")]
[Authorize]
public class TiposGraficoController : ControllerBase
{
    private readonly AppDbContext _context;

    public TiposGraficoController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TipoGrafico>>> GetTiposGrafico()
    {
        return await _context.TipoGraficos.ToListAsync();
    }
}