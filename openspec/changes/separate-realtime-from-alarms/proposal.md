## Why

El `MqttSubscriberService` está suscrito a ambos topics MQTT (`history` y `realtime`) y ejecuta `AlarmService.VerificarAsync` en ambos. Las alarmas deben dispararse solo con datos de history (persistidos y validados), no con valores efímeros del realtime. El realtime es solo para visualización vía WebSocket.

## What Changes

- Mover `VerificarAsync` dentro de `GuardarDatoSensorAsync` para que solo se ejecute cuando se persiste un dato (history)
- Eliminar el bloque `if (esRealtime)` que ejecutaba alarmas en el loop principal

## Capabilities

### Modified Capabilities
<!-- none -->

### New Capabilities
- `alarm-from-history-only`: Las alarmas solo se evalúan sobre datos de history persistidos

## Impact

- `api/Services/MqttSubscriberService.cs` — reorganizar VerificarAsync
