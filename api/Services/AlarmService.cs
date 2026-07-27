using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Services;

public class AlarmService
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly EmailService _emailService;
    private readonly ILogger<AlarmService> _logger;
    private static readonly TimeSpan Cooldown = TimeSpan.FromMinutes(5);

    public AlarmService(AppDbContext context, IHttpClientFactory httpClientFactory, EmailService emailService, ILogger<AlarmService> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
        _emailService = emailService;
        _logger = logger;
    }

    public async Task VerificarAsync(Sensor sensor, decimal valor)
    {
        if (!sensor.AlarmaActiva) return;

        var enAlarma = sensor.TipoDato switch
        {
            "digital" when sensor.ModoDigital == "contador" => VerificarAnalogico(sensor, valor),
            "digital" => VerificarDigital(sensor, valor),
            _ => VerificarAnalogico(sensor, valor)
        };

        if (!enAlarma) return;

        var ahora = DateTime.UtcNow;
        if (sensor.UltimaAlarmaEnviada.HasValue && ahora - sensor.UltimaAlarmaEnviada.Value < Cooldown)
            return;

        sensor.UltimaAlarmaEnviada = ahora;
        await _context.SaveChangesAsync();

        var canales = await _context.ConfiguracionesAlarma.Where(c => c.Activo).ToListAsync();
        foreach (var canal in canales)
        {
            try
            {
                switch (canal.Tipo)
                {
                    case "telegram":
                        await EnviarTelegram(canal.ConfigJson, sensor, valor);
                        break;
                    case "email":
                        await EnviarEmailResend(canal.ConfigJson, sensor, valor);
                        break;
                    case "whatsapp":
                        await EnviarWhatsapp(canal.ConfigJson, sensor, valor);
                        break;
                    case "sms":
                        await EnviarSms(canal.ConfigJson, sensor, valor);
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enviando notificacion por {Tipo}", canal.Tipo);
            }
        }
    }

    private static bool VerificarAnalogico(Sensor sensor, decimal valor)
    {
        if (!sensor.RangoMinimo.HasValue || !sensor.RangoMaximo.HasValue)
            return false;
        return valor < sensor.RangoMinimo.Value || valor > sensor.RangoMaximo.Value;
    }

    private static bool VerificarDigital(Sensor sensor, decimal valor)
    {
        if (valor == 1 && sensor.AlarmaEnOn) return true;
        if (valor == 0 && sensor.AlarmaEnOff) return true;
        return false;
    }

    private async Task EnviarTelegram(string configJson, Sensor sensor, decimal valor)
    {
        using var doc = JsonDocument.Parse(configJson);
        var root = doc.RootElement;
        var botToken = root.GetProperty("botToken").GetString()!;
        var chatId = root.GetProperty("chatId").GetString()!;

        var mensaje = $"ALARMA: {sensor.Nombre} ({sensor.SensorId})\nValor: {valor}\nPlanta/Area: {sensor.Area?.Planta?.Codigo}/{sensor.Area?.Codigo}";
        var url = $"https://api.telegram.org/bot{botToken}/sendMessage";

        var client = _httpClientFactory.CreateClient("TelegramBot");
        client.Timeout = TimeSpan.FromSeconds(5);

        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["chat_id"] = chatId,
            ["text"] = mensaje
        });

        var response = await client.PostAsync(url, content);
        if (!response.IsSuccessStatusCode)
            _logger.LogWarning("Telegram API error: {StatusCode}", response.StatusCode);
    }

    private async Task EnviarEmailResend(string configJson, Sensor sensor, decimal valor)
    {
        using var doc = JsonDocument.Parse(configJson);
        var root = doc.RootElement;
        var apiKey = root.TryGetProperty("apiKey", out var k) ? k.GetString() : null;
        var fromEmail = root.TryGetProperty("fromEmail", out var fe) ? fe.GetString() : null;

        var destinatarios = await _context.Usuarios
            .Where(u => u.Email != null && u.Email != "")
            .Select(u => u.Email!)
            .ToListAsync();

        if (destinatarios.Count == 0)
        {
            _logger.LogWarning("No hay usuarios con email configurado para notificar");
            return;
        }

        var subject = $"ALARMA: {sensor.Nombre} - Valor: {valor}";
        var body = $"Sensor: {sensor.Nombre} ({sensor.SensorId})\nValor: {valor}\nTimestamp: {DateTime.UtcNow:u}";

        await _emailService.SendAlarmAsync(apiKey ?? "", fromEmail ?? "", destinatarios, subject, body);
    }

    private async Task EnviarWhatsapp(string configJson, Sensor sensor, decimal valor)
    {
        using var doc = JsonDocument.Parse(configJson);
        var root = doc.RootElement;
        var phoneNumberId = root.TryGetProperty("phoneNumberId", out var pn) ? pn.GetString() : null;
        var accessToken = root.TryGetProperty("accessToken", out var at) ? at.GetString() : null;

        if (string.IsNullOrEmpty(phoneNumberId) || string.IsNullOrEmpty(accessToken))
        {
            _logger.LogWarning("WhatsApp not configured, skipping");
            return;
        }

        var destinatarios = await _context.Usuarios
            .Where(u => u.Telefono != null && u.Telefono != "")
            .Select(u => u.Telefono!)
            .ToListAsync();

        if (destinatarios.Count == 0)
        {
            _logger.LogWarning("No hay usuarios con telefono configurado para WhatsApp");
            return;
        }

        var mensaje = $"ALARMA: {sensor.Nombre} ({sensor.SensorId})\nValor: {valor}";

        // ponytail: Meta Business API placeholder — POST a graph.facebook.com/v21.0/{phoneNumberId}/messages
        // Implementar cuando el canal esté activo y haya accessToken válido
        foreach (var to in destinatarios)
        {
            _logger.LogInformation("[WhatsApp STUB] To: {Phone}, From: {PhoneId}, Msg: {Msg}", to, phoneNumberId, mensaje);
        }
    }

    private async Task EnviarSms(string configJson, Sensor sensor, decimal valor)
    {
        using var doc = JsonDocument.Parse(configJson);
        var root = doc.RootElement;
        var accountSid = root.TryGetProperty("accountSid", out var sid) ? sid.GetString() : null;
        var authToken = root.TryGetProperty("authToken", out var at) ? at.GetString() : null;
        var fromNumber = root.TryGetProperty("fromNumber", out var fn) ? fn.GetString() : null;

        if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(authToken) || string.IsNullOrEmpty(fromNumber))
        {
            _logger.LogWarning("SMS not configured, skipping");
            return;
        }

        var destinatarios = await _context.Usuarios
            .Where(u => u.Telefono != null && u.Telefono != "")
            .Select(u => u.Telefono!)
            .ToListAsync();

        if (destinatarios.Count == 0)
        {
            _logger.LogWarning("No hay usuarios con telefono configurado para SMS");
            return;
        }

        var mensaje = $"ALARMA: {sensor.Nombre} ({sensor.SensorId}) - Valor: {valor}";

        // ponytail: Twilio API placeholder — POST a api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json
        // Implementar cuando el canal esté activo y haya credenciales Twilio válidas
        foreach (var to in destinatarios)
        {
            _logger.LogInformation("[SMS STUB] To: {To}, From: {From}, Body: {Msg}", to, fromNumber, mensaje);
        }
    }
}
