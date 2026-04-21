using System.Net.WebSockets;
using System.Text;
using MQTTnet;
using MQTTnet.Protocol;
using System.Collections.Concurrent;

namespace api.Services;

public class WebSocketRealtimeService
{
    private IMqttClient? _mqttClient;
    private readonly ConcurrentDictionary<string, WebSocket> _clients = new();
    private readonly ConcurrentDictionary<string, (string Planta, string Area)> _clientInfo = new();
    private readonly ILogger<WebSocketRealtimeService> _logger;
    private readonly string _mqttBroker;
    private readonly int _mqttPort;
    private bool _mqttConnected = false;

    public WebSocketRealtimeService(ILogger<WebSocketRealtimeService> logger)
    {
        _logger = logger;
        _mqttBroker = Environment.GetEnvironmentVariable("MQTT_BROKER") ?? "localhost";
        _mqttPort = int.Parse(Environment.GetEnvironmentVariable("MQTT_PORT") ?? "1883");
    }

    public async Task InitializeAsync()
    {
        var mqttFactory = new MqttClientFactory();
        _mqttClient = mqttFactory.CreateMqttClient();

        _mqttClient.ApplicationMessageReceivedAsync += OnMqttMessageReceivedAsync;

        var options = new MqttClientOptionsBuilder()
            .WithTcpServer(_mqttBroker, _mqttPort)
            .Build();

        await _mqttClient.ConnectAsync(options);
        _mqttConnected = true;

        var subscribeOptions = mqttFactory.CreateSubscribeOptionsBuilder()
            .WithTopicFilter(f => f.WithTopic("industrial/+/+/realtime"))
            .Build();

        await _mqttClient.SubscribeAsync(subscribeOptions);
        _logger.LogInformation("WebSocket service connected to MQTT broker and subscribed to realtime topics");
    }

    private async Task OnMqttMessageReceivedAsync(MqttApplicationMessageReceivedEventArgs e)
    {
        var topic = e.ApplicationMessage.Topic;
        if (!topic.Contains("/realtime")) return;

        var topicParts = topic.Split('/');
        if (topicParts.Length < 4) return;
        var planta = topicParts[1];
        var area = topicParts[2];

        var payload = Encoding.UTF8.GetString(e.ApplicationMessage.Payload);
        var bytes = Encoding.UTF8.GetBytes(payload);

        foreach (var clientInfo in _clientInfo)
        {
            var (clientPlanta, clientArea) = clientInfo.Value;
            if (clientPlanta != planta || clientArea != area) continue;

            var ws = _clients[clientInfo.Key];
            if (ws.State == WebSocketState.Open)
            {
                try
                {
                    await ws.SendAsync(
                        new ArraySegment<byte>(bytes),
                        WebSocketMessageType.Text,
                        true,
                        CancellationToken.None);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending message to WebSocket client");
                }
            }
        }
    }

    public async Task HandleWebSocketAsync(WebSocket webSocket, string planta, string area)
    {
        var clientId = Guid.NewGuid().ToString();
        _clients[clientId] = webSocket;
        _clientInfo[clientId] = (planta, area);

        _logger.LogInformation("WebSocket client connected: {ClientId} - {Planta}/{Area}", clientId, planta, area);

        await PublishControlAsync(planta, area, "START");

        var buffer = new byte[4096];
        try
        {
            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WebSocket error for client {ClientId}", clientId);
        }
        finally
        {
            _clients.TryRemove(clientId, out _);
            _clientInfo.TryRemove(clientId, out _);
            await PublishControlAsync(planta, area, "STOP");
            _logger.LogInformation("WebSocket client disconnected: {ClientId}", clientId);
        }
    }

    private async Task PublishControlAsync(string planta, string area, string command)
    {
        if (!_mqttConnected || _mqttClient == null) return;

        var topic = $"industrial/{planta}/{area}/control";
        var message = new MqttApplicationMessageBuilder()
            .WithTopic(topic)
            .WithPayload(command)
            .WithQualityOfServiceLevel(MqttQualityOfServiceLevel.AtLeastOnce)
            .Build();

        await _mqttClient.PublishAsync(message);
        _logger.LogInformation("Published {Command} to {Topic}", command, topic);
    }
}
