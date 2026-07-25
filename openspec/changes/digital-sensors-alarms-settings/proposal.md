## Why

El sistema actual solo modela sensores analógicos con umbrales de alarma hardcodeados (`>80` rojo, `>60` ámbar), lo que hace que cualquier sensor que opere normalmente fuera de esos valores parpadee en rojo sin sentido. Además, los PLCs industriales entregan tanto entradas analógicas como digitales (ON/OFF, contactos, estados de motor), y no hay forma de representarlas. Tampoco existe un sistema de notificaciones por alarma ni una página de configuración de usuario funcional.

## What Changes

- **Sensor.cs** gana `TipoDato` ("analogico"/"digital"), `AlarmaActiva`, `RangoMinimo`, `RangoMaximo`, `AlarmaEnOn`, `AlarmaEnOff`
- **DatoSensor.cs** gana `Cambios` (contador de transiciones para sensores digitales por ciclo)
- Nuevo modelo **ConfiguracionAlarma** para canales de notificación (Telegram, Email) con credenciales cifradas en JSON
- Nuevo **AlarmService** que evalúa valores contra rangos configurados y despacha notificaciones con rate limiting
- **Bridge** distingue sensores analógicos y digitales; los digitales acumulan cambios de estado por ciclo y los reportan en el topic history
- **Frontend**: SensorCard con variante digital (indicador ON/OFF), SensorDetailModal ampliado con configuración de alarmas e historial con selector de fechas, Settings con perfil y configuración de canales
- Seed data: nuevo TipoGrafico "Digital" y Unidad "Binario"

## Capabilities

### New Capabilities
- `digital-sensors`: Sensores de tipo digital/binario con visualización ON/OFF, contador de cambios de estado por ciclo, y campos de alarma específicos (AlarmaEnOn, AlarmaEnOff mutuamente excluyentes)
- `alarm-ranges`: Rangos de alarma configurables por sensor. Analógico: RangoMinimo/RangoMaximo (fuera = warning). Digital: AlarmaEnOn/AlarmaEnOff. Los colores del frontend reflejan los rangos reales del sensor, eliminando thresholds hardcodeados
- `alarm-notifications`: Sistema de notificaciones multicanal (Telegram vía Bot API, Email vía SMTP). Configuración de credenciales por Admin/SuperAdmin. Rate limiting por sensor para evitar spam
- `user-settings`: Página de ajustes con edición de perfil (nombre, email, teléfono, contraseña) para todos los usuarios, y sección de canales de alarma exclusiva para Admin/SuperAdmin
- `sensor-history`: Endpoint de historial de datos con filtro por rango de fechas. Para sensores digitales, incluye conteo de cambios de estado por ciclo

### Modified Capabilities
- `sensor-cards`: Las tarjetas de sensor ahora discriminan entre analógico y digital. Los colores de estado (verde/ámbar/rojo) se determinan por los rangos configurados en el sensor, no por números mágicos. La tarjeta digital muestra indicador ON/OFF sin gráfico

## Impact

- **Modelos**: Sensor (+6 campos), DatoSensor (+1 campo), ConfiguracionAlarma (nuevo), migración EF requerida
- **API**: SensoresController (PUT extendido), DatosController (GET con filtro de fechas), ConfiguracionAlarmaController (nuevo CRUD), AuthController (PUT /me ya existe)
- **Servicios**: AlarmService (nuevo), MqttSubscriberService (integración con AlarmService + campo Cambios), WebSocketRealtimeService (forward sin cambios, ignora Cambios)
- **Bridge**: sensors.py (+tipo), plc_simulation.py (lógica digital + contador), método leer_history() separado de leer_datos()
- **Frontend**: SensorCard (+digital), SensorDetailModal (+rangos/alarma/historial), Settings (+perfil/+canales), api.js (sin cambios)
- **Seed**: TipoGrafico (id=4 "Digital"), Unidad (id=7 "Binario", símbolo "BOOL")
- **No es breaking**: los sensores existentes mantienen TipoDato="analogico" por defecto, AlarmaActiva=false, Cambios=0
