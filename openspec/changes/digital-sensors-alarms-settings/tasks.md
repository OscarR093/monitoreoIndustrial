## 1. Database Models and Migration

- [x] 1.1 Add TipoDato, AlarmaActiva, RangoMinimo, RangoMaximo, AlarmaEnOn, AlarmaEnOff, UltimaAlarmaEnviada fields to Sensor.cs
- [x] 1.2 Add Cambios field to DatoSensor.cs
- [x] 1.3 Create ConfiguracionAlarma.cs model (Id, Tipo, Activo, ConfigJson, CreadoPorId, CreatedAt)
- [x] 1.4 Add ConfiguracionAlarma DbSet to AppDbContext and configure OnModelCreating
- [x] 1.5 Generate EF Core migration and apply

## 2. Seed Data

- [x] 2.1 Add TipoGrafico seed: Id=4, Nombre="Digital", Widget="status"
- [x] 2.2 Add Unidad seed: Id=7, Nombre="Binario", Simbolo="BOOL"
- [x] 2.3 Update SeedData method in AppDbContext

## 3. Bridge - Digital Sensor Support

- [x] 3.1 Add tipo field ("analogico"/"digital") to SENSORES list in sensors.py
- [x] 3.2 Add digital input simulation logic to PLCSimulation (random toggle, change counter)
- [x] 3.3 Add leer_history() method that includes accumulated cambios and resets counter
- [x] 3.4 Modify leer_datos() to include tipo field in output messages
- [x] 3.5 Update HiloHistory to call leer_history() instead of leer_datos()
- [x] 3.6 Update MqttSerializer/publish to handle optional cambios field

## 4. API - Controllers

- [x] 4.1 Extend PUT /api/sensores/{id} to accept RangoMinimo, RangoMaximo, AlarmaEnOn, AlarmaEnOff, AlarmaActiva, TipoDato fields
- [x] 4.2 Add validation: AlarmaEnOn and AlarmaEnOff cannot both be true, RangoMinimo < RangoMaximo when both set
- [x] 4.3 Add from/to query parameters to GET /api/datos for date range filtering
- [x] 4.4 Create ConfiguracionAlarmaController with CRUD endpoints (Authorize AdminOrSuperAdmin)
- [x] 4.5 Add ConfigJson validation by Tipo in ConfiguracionAlarmaController (Telegram requires botToken+chatId, Email requires smtpHost+port+credentials)

## 5. API - AlarmService

- [x] 5.1 Create AlarmService class with VerificarAsync(sensor, valor) method
- [x] 5.2 Implement analog alarm logic: check valor against RangoMinimo/RangoMaximo
- [x] 5.3 Implement digital alarm logic: check valor against AlarmaEnOn/AlarmaEnOff
- [x] 5.4 Implement rate limiting: check UltimaAlarmaEnviada timestamp, cooldown 5 min
- [x] 5.5 Implement Telegram notification dispatch via HttpClient to Bot API
- [x] 5.6 Implement Email notification dispatch via SmtpClient
- [x] 5.7 Integrate AlarmService call into MqttSubscriberService.GuardarDatoSensorAsync() for realtime messages only
- [x] 5.8 Register AlarmService as Scoped in Program.cs

## 6. MQTT Subscriber Updates

- [x] 6.1 Add tipo and cambios fields to DatoSensorMessage class (with backward-compatible defaults)
- [x] 6.2 Update GuardarDatoSensorAsync to set TipoDato on auto-created sensor from message tipo field
- [x] 6.3 Update GuardarDatoSensorAsync to set Cambios on DatoSensor from message cambios field
- [x] 6.4 Auto-create sensor with correct TipoGraficoId (4 for digital) and UnidadId (7 for digital) when tipo="digital"

## 7. Frontend - SensorCard Digital Variant

- [x] 7.1 Add digital sensor rendering in SensorCard: ON/OFF indicator component instead of charts
- [x] 7.2 Replace hardcoded thresholds (60, 80) with sensor-configured ranges in status useMemo
- [x] 7.3 Apply digital alarm logic in status useMemo (AlarmaEnOn/AlarmaEnOff match)
- [x] 7.4 Add cambio count badge to digital sensor card when cambios > 0

## 8. Frontend - SensorDetailModal Enhancement

- [x] 8.1 Add date range selector (from/to inputs) to detail modal history section
- [x] 8.2 Add alarm configuration section: RangoMinimo/RangoMaximo inputs for analog, AlarmaEnOn/AlarmaEnOff checkboxes for digital, AlarmaActiva toggle
- [x] 8.3 Make alarm config fields editable only for Admin/SuperAdmin, read-only for Viewer
- [x] 8.4 Add digital sensor history table: timestamp, ON/OFF state indicator, cambio count
- [x] 8.5 Update modal stats (min/max/avg) to reflect selected date range

## 9. Frontend - Settings Page

- [x] 9.1 Replace Settings placeholder with profile section: NombreCompleto, Email, Telefono (editable), password change
- [x] 9.2 Add alarm channels section (visible to Admin/SuperAdmin only)
- [x] 9.3 Build Telegram channel form: botToken, chatId inputs with Activo toggle
- [x] 9.4 Build Email channel form: SMTP host, port, username, password (masked), from email, to email with Activo toggle
- [x] 9.5 Add save/cancel actions per channel form

## 10. Frontend - Display Names Update

- [x] 10.1 Add sensor type indication to display names (e.g., digital sensors show "DIG" badge or symbol)

## 11. Verification and Testing

- [x] 11.1 Build and verify .NET API compiles without errors
- [x] 11.2 Build and verify frontend compiles without errors
- [x] 11.3 Run existing xUnit tests to verify no regressions
- [x] 11.4 Run bridge simulation and verify digital sensors appear in dashboard with correct data format
