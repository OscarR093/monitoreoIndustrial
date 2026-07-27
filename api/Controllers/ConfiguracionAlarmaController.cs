using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("api/configuracion-alarma")]
[Authorize(Policy = "AdminOrSuperAdmin")]
public class ConfiguracionAlarmaController : ControllerBase
{
    private readonly AppDbContext _context;

    public ConfiguracionAlarmaController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var configs = await _context.ConfiguracionesAlarma.ToListAsync();
        return configs.Select(c => new
        {
            c.Id,
            c.Tipo,
            c.Activo,
            ConfigJson = JsonSerializer.Deserialize<object>(c.ConfigJson),
            c.CreadoPorId,
            c.CreatedAt
        }).ToList();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> GetById(int id)
    {
        var config = await _context.ConfiguracionesAlarma.FindAsync(id);
        if (config == null) return NotFound();
        return new
        {
            config.Id,
            config.Tipo,
            config.Activo,
            ConfigJson = JsonSerializer.Deserialize<object>(config.ConfigJson),
            config.CreadoPorId,
            config.CreatedAt
        };
    }

    [HttpPost]
    public async Task<ActionResult<ConfiguracionAlarma>> Create([FromBody] CreateConfiguracionAlarmaDto dto)
    {
        var error = ValidateConfig(dto.Tipo, dto.ConfigJson);
        if (error != null) return BadRequest(error);

        var existing = await _context.ConfiguracionesAlarma.FirstOrDefaultAsync(c => c.Tipo == dto.Tipo);
        if (existing != null)
            return BadRequest($"Ya existe una configuracion para el canal '{dto.Tipo}'. Use PUT para actualizarla.");

        var userIdClaim = User.FindFirst("userId")?.Value;
        int? creadoPorId = userIdClaim != null ? int.Parse(userIdClaim) : null;

        var config = new ConfiguracionAlarma
        {
            Tipo = dto.Tipo,
            ConfigJson = dto.ConfigJson,
            Activo = false,
            CreadoPorId = creadoPorId
        };

        _context.ConfiguracionesAlarma.Add(config);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = config.Id }, config);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateConfiguracionAlarmaDto dto)
    {
        var config = await _context.ConfiguracionesAlarma.FindAsync(id);
        if (config == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Tipo))
        {
            var error = ValidateConfig(dto.Tipo, dto.ConfigJson ?? config.ConfigJson);
            if (error != null) return BadRequest(error);
            config.Tipo = dto.Tipo;
        }

        if (dto.ConfigJson != null)
        {
            var error = ValidateConfig(config.Tipo, dto.ConfigJson);
            if (error != null) return BadRequest(error);
            config.ConfigJson = dto.ConfigJson;
        }

        config.Activo = dto.Activo;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var config = await _context.ConfiguracionesAlarma.FindAsync(id);
        if (config == null) return NotFound();
        _context.ConfiguracionesAlarma.Remove(config);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static string? ValidateConfig(string tipo, string configJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(configJson);
            var root = doc.RootElement;

            if (tipo == "telegram")
            {
                if (!root.TryGetProperty("botToken", out _) || !root.TryGetProperty("chatId", out _))
                    return "Configuracion Telegram requiere 'botToken' y 'chatId'";
            }
            else if (tipo == "email")
            {
                if (!root.TryGetProperty("smtpHost", out _) || !root.TryGetProperty("smtpPort", out _))
                    return "Configuracion Email requiere 'smtpHost' y 'smtpPort'";
            }
            else if (tipo == "whatsapp")
            {
                if (!root.TryGetProperty("phoneNumberId", out _) || !root.TryGetProperty("accessToken", out _))
                    return "Configuracion WhatsApp requiere 'phoneNumberId' y 'accessToken'";
            }
            else if (tipo == "sms")
            {
                if (!root.TryGetProperty("accountSid", out _) || !root.TryGetProperty("authToken", out _) || !root.TryGetProperty("fromNumber", out _))
                    return "Configuracion SMS requiere 'accountSid', 'authToken' y 'fromNumber'";
            }
            else
            {
                return $"Tipo de canal desconocido: '{tipo}'. Valores validos: telegram, email, whatsapp, sms";
            }

            return null;
        }
        catch (JsonException)
        {
            return "ConfigJson no es un JSON valido";
        }
    }
}

public class CreateConfiguracionAlarmaDto
{
    public string Tipo { get; set; } = "";
    public string ConfigJson { get; set; } = "{}";
}

public class UpdateConfiguracionAlarmaDto
{
    public string? Tipo { get; set; }
    public string? ConfigJson { get; set; }
    public bool Activo { get; set; }
}
