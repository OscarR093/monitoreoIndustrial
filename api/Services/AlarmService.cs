using System.Net;
using System.Net.Mail;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using api.Data;
using api.Models;

namespace api.Services;

public class AlarmService
{
    private readonly AppDbContext _context;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<AlarmService> _logger;
    private static readonly TimeSpan Cooldown = TimeSpan.FromMinutes(5);

    public AlarmService(AppDbContext context, IHttpClientFactory httpClientFactory, ILogger<AlarmService> logger)
    {
        _context = context;
        _httpClientFactory = httpClientFactory;
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
                if (canal.Tipo == "telegram")
                    await EnviarTelegram(canal.ConfigJson, sensor, valor);
                else if (canal.Tipo == "email")
                    await EnviarEmail(canal.ConfigJson, sensor, valor);
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

    private async Task EnviarEmail(string configJson, Sensor sensor, decimal valor)
    {
        using var doc = JsonDocument.Parse(configJson);
        var root = doc.RootElement;
        var host = root.GetProperty("smtpHost").GetString()!;
        var port = root.GetProperty("smtpPort").GetInt32();
        var username = root.TryGetProperty("username", out var u) ? u.GetString() : null;
        var password = root.TryGetProperty("password", out var p) ? p.GetString() : null;
        var fromEmail = root.TryGetProperty("fromEmail", out var fe) ? fe.GetString() : username;
        var toEmail = root.TryGetProperty("toEmail", out var te) ? te.GetString() : username;

        using var client = new SmtpClient(host, port);
        client.EnableSsl = true;
        client.Timeout = 5000;

        if (!string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
            client.Credentials = new NetworkCredential(username, password);

        var subject = $"ALARMA: {sensor.Nombre} - Valor: {valor}";
        var body = $"Sensor: {sensor.Nombre} ({sensor.SensorId})\nValor: {valor}\nTimestamp: {DateTime.UtcNow:u}";

        await client.SendMailAsync(fromEmail!, toEmail!, subject, body);
    }
}
