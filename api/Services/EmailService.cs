using System.Net.Http.Json;
using System.Text.Json;

namespace api.Services;

public class EmailService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<EmailService> _logger;
    private readonly bool _enabled;
    private readonly string _apiUrl;
    private readonly string _apiKey;
    private readonly string _from;

    public EmailService(IHttpClientFactory httpClientFactory, ILogger<EmailService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _enabled = Environment.GetEnvironmentVariable("EMAIL_SERVICE_ENABLED") == "true";
        _apiUrl = Environment.GetEnvironmentVariable("EMAIL_API_URL") ?? "https://api.resend.com/emails";
        _apiKey = Environment.GetEnvironmentVariable("EMAIL_API_KEY") ?? "";
        _from = Environment.GetEnvironmentVariable("EMAIL_FROM") ?? "alerts@monitoreo.local";
    }

    public bool IsEnabled => _enabled;

    public async Task<string?> SendPinAsync(string toEmail, string pin)
    {
        if (!_enabled) { _logger.LogInformation("Email disabled, PIN not sent"); return null; }
        return await SendAsync(toEmail, "PIN de verificación - Monitoreo Industrial",
            $@"<div style='font-family:monospace;max-width:400px;margin:0 auto;padding:20px'>
  <h2 style='color:#00E5FF'>Monitoreo Industrial</h2>
  <p>Tu código de verificación para cambiar la contraseña:</p>
  <div style='background:#0a0a0a;border:1px solid #333;border-radius:8px;padding:20px;text-align:center;margin:20px 0'>
    <span style='font-size:32px;font-weight:bold;color:#00E5FF;letter-spacing:8px'>{pin}</span>
  </div>
  <p style='color:#666;font-size:12px;'>Este código expira en 5 minutos.</p>
</div>");
    }

    public async Task SendAlarmAsync(string apiKey, string fromEmail, List<string> toEmails, string subject, string body)
    {
        if (!_enabled) { _logger.LogInformation("Email disabled, alarm not sent: {Subject}", subject); return; }
        foreach (var to in toEmails)
            await SendAsync(to, subject, body, apiKey, fromEmail);
    }

    private async Task<string?> SendAsync(string to, string subject, string html, string? apiKeyOverride = null, string? fromOverride = null)
    {
        var key = apiKeyOverride ?? _apiKey;
        var from = fromOverride ?? _from;

        try
        {
            var client = _httpClientFactory.CreateClient("Resend");
            client.Timeout = TimeSpan.FromSeconds(10);

            var payload = new { from, to, subject, html };
            var request = new HttpRequestMessage(HttpMethod.Post, _apiUrl)
            {
                Content = JsonContent.Create(payload)
            };
            request.Headers.Add("Authorization", $"Bearer {key}");

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var respBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Resend API error {Status}: {Body}", response.StatusCode, respBody);
                return null;
            }

            _logger.LogInformation("Email sent to {Email}", to);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", to);
            return null;
        }
    }
}
