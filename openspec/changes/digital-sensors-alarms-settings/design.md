## Context

El sistema es un dashboard industrial con backend .NET 10 + PostgreSQL, bridge Python que lee PLCs vía Modbus TCP y publica en MQTT (EMQX), y frontend React + Vite + Tailwind. Actualmente solo modela sensores analógicos con thresholds hardcodeados en el frontend (`>80` = crítico, `>60` = warning). No existe sistema de alarmas ni soporte para entradas digitales.

## Goals / Non-Goals

**Goals:**
- Modelar sensores digitales/binarios con su propia lógica de alarma (ON/OFF)
- Reemplazar thresholds hardcodeados por rangos configurables por sensor
- Sistema de notificaciones multicanal (Telegram + Email) con rate limiting
- Página de ajustes con edición de perfil y configuración de canales de alarma (Admin+)
- Historial de datos con filtro por fechas y contador de cambios para digitales
- Bridge con soporte para sensores digitales y contador de transiciones

**Non-Goals:**
- WhatsApp y SMS (complejidad alta con APIs externas, pospuestos)
- Dashboard de historial de alarmas (futuro)
- Escalamiento de alarmas (ej. notificar a Admin si Viewer no reconoce)
- Sensores digitales en el PLC real (solo simulación por ahora)

## Decisions

### 1. TipoDato como string en lugar de enum

**Decisión**: Campo `string TipoDato` con valores `"analogico"` y `"digital"` en Sensor.cs.

**Alternativa considerada**: Enum en C#. Se descartó porque Entity Framework requiere conversiones explícitas para enums con strings en PostgreSQL y añade fricción en migraciones. Un string con validación en el controller es más simple y directo.

### 2. Rangos de alarma: 2 niveles (normal/warning) sin crítico

**Decisión**: Solo `RangoMinimo` y `RangoMaximo` (decimal?, nullable). Fuera de rango = warning (ámbar). Dentro = normal (verde). Sin tercer nivel.

**Alternativa considerada**: 4 rangos (normal + warning + crítico). El usuario eligió mantenerlo simple con 2 estados de color. Si se necesita granularidad adicional en el futuro, se añaden `RangoCriticoMinimo`/`RangoCriticoMaximo`.

### 3. Alarma digital: dos booleanos mutuamente excluyentes

**Decisión**: `AlarmaEnOn` y `AlarmaEnOff` como `bool` (no nullable). Pueden estar ambos en false (sin alarma), pero no ambos en true. La validación de exclusión mutua ocurre en el controller.

**Alternativa considerada**: Un solo `bool? AlarmaEnUno` donde null = sin alarma, true = alarma en 1, false = alarma en 0. El usuario prefirió dos checkboxes independientes con restricción de exclusión mutua, que es más explícito en la UI.

### 4. Configuración de canales: JSON flexible por fila

**Decisión**: Modelo `ConfiguracionAlarma` con `Tipo` (string), `Activo` (bool), `ConfigJson` (string). Una fila por tipo de canal. El JSON se valida al guardar según el tipo.

```json
// Telegram
{ "botToken": "...", "chatId": "..." }

// Email
{ "smtpHost": "smtp.example.com", "smtpPort": 587, "username": "...", "password": "...", "fromEmail": "...", "toEmail": "..." }
```

**Alternativa considerada**: Columnas dedicadas por canal. Se descartó porque añade rigidez — cada nuevo canal requeriría migración de schema. JSON permite extender canales sin migraciones.

### 5. AlarmService: verificación síncrona en el pipeline MQTT

**Decisión**: `AlarmService` se invoca desde `MqttSubscriberService.GuardarDatoSensorAsync()` después de guardar el dato. Es síncrono (no background job). Usa `IServiceScope` del subscriber.

**Alternativa considerada**: Background service que sondea la DB por datos nuevos. Se descartó por complejidad innecesaria — ya tenemos el dato en mano cuando llega por MQTT, no hay razón para diferirlo.

### 6. Rate limiting: timestamp en el modelo Sensor

**Decisión**: Añadir `UltimaAlarmaEnviada` (DateTime?) a Sensor. El AlarmService verifica que hayan pasado al menos 5 minutos desde la última notificación antes de enviar una nueva. Solo se notifica en transición de estado (normal→warning), no en cada lectura fuera de rango.

**Alternativa considerada**: Diccionario en memoria en el AlarmService. Funciona pero no sobrevive reinicios del API — tras un reinicio, se re-notificarían todas las alarmas activas.

### 7. Bridge: métodos separados para history y realtime

**Decisión**: El PLC simulado expone `leer_datos()` (para realtime, `cambios=0`) y `leer_history()` (incluye contador acumulado, resetea después). Así se evita que el hilo de realtime consuma el contador antes que el de history.

**Alternativa considerada**: Un solo método con flag. El problema es que el contador es estado mutable compartido entre hilos. Separar los métodos hace explícito el contrato: history lee y resetea, realtime solo lee.

### 8. MQTT message: campos opcionales para backward-compat

**Decisión**: `DatoSensorMessage` gana `tipo` (default `"analogico"`) y `cambios` (default `0`). El bridge incluye estos campos para todos los sensores. Si un bridge antiguo no los envía, los defaults aseguran compatibilidad.

### 9. Despacho de notificaciones: directo desde AlarmService

**Decisión**: `AlarmService` despacha notificaciones directamente usando `HttpClient` (Telegram Bot API) y `SmtpClient` (Email). Sin cola de mensajes ni workers separados.

**Alternativa considerada**: Cola en DB + worker background. Overkill para el volumen esperado (decenas de sensores, pocas alarmas por minuto).

## Risks / Trade-offs

- **[Contador de cambios en bridge]**: Si el bridge se reinicia, el contador se pierde y el siguiente registro de history muestra un ciclo parcial. Mitigación: es aceptable, el dato es informativo no crítico.
- **[ConfigJson sin cifrado]**: Las credenciales (bot token, SMTP password) se almacenan en texto plano en la DB. Mitigación: en el futuro se puede añadir cifrado con `IDataProtector`. Por ahora el acceso a la DB ya está restringido.
- **[AlarmService síncrono]**: Si el envío de notificación falla (timeout de red), bloquea brevemente el pipeline MQTT. Mitigación: timeout de 5 segundos en HttpClient/SmtpClient, la excepción se loguea sin interrumpir el guardado de datos.
- **[Escalabilidad del rate limiting]**: El timestamp en Sensor requiere escritura en DB por cada notificación. Para cientos de sensores no es problema. Si escala a miles, se puede mover a caché distribuida.
