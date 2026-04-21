using System.Net.WebSockets;
using Microsoft.AspNetCore.Mvc;
using api.Services;

namespace api.Controllers;

[ApiController]
public class WebSocketController : ControllerBase
{
    private readonly WebSocketRealtimeService _wsService;
    private readonly ILogger<WebSocketController> _logger;

    public WebSocketController(WebSocketRealtimeService wsService, ILogger<WebSocketController> logger)
    {
        _wsService = wsService;
        _logger = logger;
    }

    [Route("/ws/realtime")]
    public async Task Get()
    {
        if (!HttpContext.WebSockets.IsWebSocketRequest)
        {
            HttpContext.Response.StatusCode = 400;
            return;
        }

        var planta = HttpContext.Request.Query["planta"].ToString();
        var area = HttpContext.Request.Query["area"].ToString();

        if (string.IsNullOrEmpty(planta) || string.IsNullOrEmpty(area))
        {
            HttpContext.Response.StatusCode = 400;
            await HttpContext.Response.WriteAsync("Missing planta or area parameter");
            return;
        }

        using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
        await _wsService.HandleWebSocketAsync(webSocket, planta, area);
    }
}
