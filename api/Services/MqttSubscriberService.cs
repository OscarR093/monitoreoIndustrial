using Microsoft.EntityFrameworkCore;
using MQTTnet;
using MQTTnet.Protocol;
using System.Text;
using System.Text.Json;
using api.Data;
using api.Models;

namespace api.Services;

public class MqttSubscriberService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<MqttSubscriberService> _logger;
    private IMqttClient? _mqttClient;
    private readonly string _mqttBroker;
    private readonly int _mqttPort;

    public MqttSubscriberService(IServiceProvider serviceProvider, ILogger<MqttSubscriberService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _mqttBroker = Environment.GetEnvironmentVariable("MQTT_BROKER") ?? "localhost";
        _mqttPort = int.Parse(Environment.GetEnvironmentVariable("MQTT_PORT") ?? "1883");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MQTT Subscriber Service starting...");

        var mqttFactory = new MqttClientFactory();
        _mqttClient = mqttFactory.CreateMqttClient();

        _mqttClient.ApplicationMessageReceivedAsync += OnMessageReceivedAsync;

        var options = new MqttClientOptionsBuilder()
            .WithTcpServer(_mqttBroker, _mqttPort)
            .Build();

        try
        {
            await _mqttClient.ConnectAsync(options, stoppingToken);
            _logger.LogInformation("Connected to MQTT broker at {Broker}:{Port}", _mqttBroker, _mqttPort);

            var subscribeOptions = mqttFactory.CreateSubscribeOptionsBuilder()
                .WithTopicFilter(f => f.WithTopic("industrial/+/+/history"))
                .WithTopicFilter(f => f.WithTopic("industrial/+/+/realtime"))
                .Build();

            await _mqttClient.SubscribeAsync(subscribeOptions, stoppingToken);
            _logger.LogInformation("Subscribed to industrial/+/+/history and industrial/+/+/realtime topics");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to MQTT broker");
        }

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(1000, stoppingToken);
        }
    }

    private async Task OnMessageReceivedAsync(MqttApplicationMessageReceivedEventArgs e)
    {
        var topic = e.ApplicationMessage.Topic;
        var payload = Encoding.UTF8.GetString(e.ApplicationMessage.Payload);

        _logger.LogInformation("Received message on topic: {Topic}", topic);

        try
        {
            var datos = JsonSerializer.Deserialize<List<DatoSensorMessage>>(payload, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (datos == null || datos.Count == 0) return;

            var parts = topic.Split('/');
            if (parts.Length < 4) return;

            var plantaCodigo = parts[1];
            var areaCodigo = parts[2];
            var esRealtime = parts[3] == "realtime";

            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            foreach (var dato in datos)
            {
                await GuardarDatoSensorAsync(dbContext, plantaCodigo, areaCodigo, dato);
            }

            await dbContext.SaveChangesAsync();
            _logger.LogInformation("Saved {Count} sensor data from {Topic}", datos.Count, topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing MQTT message from topic {Topic}", topic);
        }
    }

    private async Task GuardarDatoSensorAsync(AppDbContext dbContext, string plantaCodigo, string areaCodigo, DatoSensorMessage dato)
    {
        var area = await dbContext.Areas
            .Include(a => a.Planta)
            .FirstOrDefaultAsync(a => a.Planta!.Codigo == plantaCodigo && a.Codigo == areaCodigo);

        if (area == null)
        {
            _logger.LogWarning("Area not found: {Planta}/{Area}", plantaCodigo, areaCodigo);
            return;
        }

        var sensor = await dbContext.Sensores
            .FirstOrDefaultAsync(s => s.AreaId == area.Id && s.SensorId == dato.sensor);

        if (sensor == null)
        {
            var primerUnidad = await dbContext.Unidades.FirstOrDefaultAsync();
            var primerTipo = await dbContext.TipoGraficos.FirstOrDefaultAsync();

            if (primerUnidad == null || primerTipo == null)
            {
                _logger.LogWarning("No unidades or tipos graficos configured");
                return;
            }

            sensor = new Sensor
            {
                AreaId = area.Id,
                SensorId = dato.sensor,
                Registro = 0,
                Nombre = $"Sensor {dato.sensor}",
                TipoGraficoId = primerTipo.Id,
                UnidadId = primerUnidad.Id
            };

            dbContext.Sensores.Add(sensor);
            await dbContext.SaveChangesAsync();
            _logger.LogInformation("Auto-created sensor: {SensorId}", dato.sensor);
        }

        var datoSensor = new DatoSensor
        {
            SensorId = sensor.Id,
            Valor = dato.valor,
            Timestamp = (long)dato.timestamp
        };

        dbContext.DatosSensores.Add(datoSensor);
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_mqttClient?.IsConnected == true)
        {
            await _mqttClient.DisconnectAsync();
        }
        await base.StopAsync(cancellationToken);
    }
}

public class DatoSensorMessage
{
    public string sensor { get; set; } = "";
    public decimal valor { get; set; }
    public double timestamp { get; set; }
}
