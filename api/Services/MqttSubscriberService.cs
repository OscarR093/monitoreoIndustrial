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
    private readonly bool _mqttUseTls;
    private readonly string _mqttUser;
    private readonly string _mqttPass;

    public MqttSubscriberService(IServiceProvider serviceProvider, ILogger<MqttSubscriberService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _mqttBroker = Environment.GetEnvironmentVariable("MQTT_BROKER") ?? "localhost";
        _mqttPort = int.Parse(Environment.GetEnvironmentVariable("MQTT_PORT") ?? "1883");
        _mqttUseTls = (Environment.GetEnvironmentVariable("MQTT_USE_TLS") ?? "false").Equals("true", StringComparison.OrdinalIgnoreCase);
        _mqttUser = Environment.GetEnvironmentVariable("MQTT_USER") ?? "";
        _mqttPass = Environment.GetEnvironmentVariable("MQTT_PASS") ?? "";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("MQTT Subscriber Service starting...");

        var mqttFactory = new MqttClientFactory();
        _mqttClient = mqttFactory.CreateMqttClient();

        _mqttClient.ApplicationMessageReceivedAsync += OnMessageReceivedAsync;

        var optionsBuilder = new MqttClientOptionsBuilder()
            .WithTcpServer(_mqttBroker, _mqttPort);

        if (!string.IsNullOrEmpty(_mqttUser) && !string.IsNullOrEmpty(_mqttPass))
            optionsBuilder.WithCredentials(_mqttUser, _mqttPass);

        if (_mqttUseTls)
            optionsBuilder.WithTlsOptions(o => { });

        var options = optionsBuilder.Build();

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
            var alarmService = scope.ServiceProvider.GetRequiredService<AlarmService>();

            foreach (var dato in datos)
            {
                var sensor = await GuardarDatoSensorAsync(dbContext, plantaCodigo, areaCodigo, dato);

                if (esRealtime && sensor != null)
                {
                    try { await alarmService.VerificarAsync(sensor, dato.valor); }
                    catch (Exception ex) { _logger.LogError(ex, "AlarmService error for sensor {SensorId}", sensor.SensorId); }
                }
            }

            await dbContext.SaveChangesAsync();
            _logger.LogInformation("Saved {Count} sensor data from {Topic}", datos.Count, topic);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing MQTT message from topic {Topic}", topic);
        }
    }

    private async Task<Sensor?> GuardarDatoSensorAsync(AppDbContext dbContext, string plantaCodigo, string areaCodigo, DatoSensorMessage dato)
    {
        var area = await dbContext.Areas
            .Include(a => a.Planta)
            .FirstOrDefaultAsync(a => a.Planta!.Codigo == plantaCodigo && a.Codigo == areaCodigo);

        if (area == null)
        {
            _logger.LogWarning("Area not found: {Planta}/{Area}", plantaCodigo, areaCodigo);
            return null;
        }

        var sensor = await dbContext.Sensores
            .FirstOrDefaultAsync(s => s.AreaId == area.Id && s.SensorId == dato.sensor);

        if (sensor == null)
        {
            var esDigital = dato.tipo == "digital";
            var esContador = esDigital && dato.modo == "contador";
            var unidadId = esContador
                ? (await dbContext.Unidades.FirstOrDefaultAsync(u => u.Simbolo == "ud"))?.Id ?? 1
                : esDigital
                    ? (await dbContext.Unidades.FirstOrDefaultAsync(u => u.Simbolo == "BOOL"))?.Id ?? 1
                    : (await dbContext.Unidades.FirstOrDefaultAsync())?.Id ?? 1;
            var tipoGraficoId = esContador
                ? (await dbContext.TipoGraficos.FirstOrDefaultAsync(t => t.Widget == "counter"))?.Id ?? 1
                : esDigital
                    ? (await dbContext.TipoGraficos.FirstOrDefaultAsync(t => t.Widget == "status"))?.Id ?? 1
                    : (await dbContext.TipoGraficos.FirstOrDefaultAsync())?.Id ?? 1;

            sensor = new Sensor
            {
                AreaId = area.Id,
                SensorId = dato.sensor,
                Registro = 0,
                Nombre = $"Sensor {dato.sensor}",
                TipoGraficoId = tipoGraficoId,
                UnidadId = unidadId,
                TipoDato = dato.tipo,
                ModoDigital = esDigital ? dato.modo : null
            };

            dbContext.Sensores.Add(sensor);
            await dbContext.SaveChangesAsync();
            _logger.LogInformation("Auto-created sensor: {SensorId} (tipo: {Tipo}, modo: {Modo})", dato.sensor, dato.tipo, dato.modo);
        }

        var datoSensor = new DatoSensor
        {
            SensorId = sensor.Id,
            Valor = dato.valor,
            Cambios = dato.cambios,
            Timestamp = (long)dato.timestamp
        };

        dbContext.DatosSensores.Add(datoSensor);
        return sensor;
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
    public int cambios { get; set; } = 0;
    public string tipo { get; set; } = "analogico";
    public string modo { get; set; } = "estado";
    public double timestamp { get; set; }
}
