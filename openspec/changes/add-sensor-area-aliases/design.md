## Context

El bridge publica datos usando identificadores técnicos inmutables: `planta` (p1), `area` (a1) y `sensor` (s1, s2...). Estos códigos son necesarios para el routing MQTT, la suscripción de la API y la persistencia de datos históricos. Sin embargo, para operadores y administradores de planta, los códigos técnicos son crípticos. El sistema necesita un mecanismo de alias editable que mantenga la identidad técnica intacta.

Actualmente `Sensor` y `Area` tienen campos `Nombre` heredados del seed, pero no están pensados como alias editables por administradores ni se propagan como primera opción de visualización. El frontend muestra `sensorId` y `codigo` directamente.

## Goals / Non-Goals

**Goals:**
- Agregar `Alias` opcional a `Sensor` y `Area` en la base de datos.
- Exponer el alias en todos los endpoints que devuelven sensores o áreas.
- Permitir a SuperAdmin y Admin editar alias via REST.
- Mostrar alias en dashboard, tarjetas, zonas, selector de ubicación y detalle de sensor.
- Mantener `SensorId` y `Codigo` inmutables para el bridge, WebSocket y MQTT.

**Non-Goals:**
- No renombrar plantas (scope futuro; el bridge también usa `planta` en topics).
- No cambiar identificadores técnicos desde el frontend.
- No historial de cambios de alias.
- No traducciones multilenguaje.

## Decisions

### D1: Nuevo campo `Alias` en `Sensor` y `Area`, no reutilizar `Nombre`

**Decisión:** Crear `Alias` como campo separado en lugar de reutilizar `Nombre`.

**Rationale:** `Nombre` puede usarse como descripción técnica o nombre corto del seed. El `Alias` es un nombre operativo editable por el cliente. Separarlos permite que el seed siga intacto mientras el alias cambia.

### D2: Alias editable solo por PUT parcial

**Decisión:** Los endpoints `PUT /api/sensores/{id}` y `PUT /api/areas/{id}` aceptan un body parcial que puede incluir `Alias`. El controlador ignora intentos de cambiar `SensorId`, `Codigo`, `PlantaId` o `AreaId`.

**Rationale:** Reutiliza los endpoints existentes con validación mínima. No requiere nuevos endpoints ni DTOs complejos. Los campos sensibles se ignoran silenciosamente en lugar de rechazar la petición, simplificando el frontend.

### D3: Alias expuesto como string nullable en DTOs

**Decisión:** Los DTOs de `Sensor` y `Area` incluyen `Alias` como `string?`. El frontend decide si renderiza `Alias ?? SensorId` o `Alias ?? Codigo`.

**Rationale:** Mantiene la API simple y la lógica de fallback centralizada en el frontend, donde el contexto de visualización varía (tarjeta, selector, modal).

### D4: Persistencia en PostgreSQL con migración EF

**Decisión:** Agregar columnas `Alias` a `Sensores` y `Areas` mediante migración EF Core.

**Rationale:** Es el ORM ya usado en el proyecto. El alias es un dato relacional pequeño que pertenece a las tablas existentes.

## Risks / Trade-offs

- **[Riesgo] El bridge no conoce el alias** → Si el bridge reinicia, sigue usando `s1`, `a1`, etc. El alias se recupera de la DB y se aplica en la capa de presentación. Aceptable porque el alias es puramente visual.
- **[Riesgo] Alias duplicados en la misma área** → Dos sensores con el mismo alias en una misma área podrían confundir al operador. Mitigación: no agregar unique constraint a nivel DB (los códigos técnicos son únicos), pero se puede mostrar el `sensorId` como tooltip o subtítulo.
- **[Trade-off] El seed inicial no tiene alias** → Los sensores creados por migración aparecerán con códigos técnicos hasta que un admin los renombre. Aceptable para el MVP.

## Migration Plan

1. Crear migración EF que agrega `Alias` a `Sensores` y `Areas`.
2. Aplicar migración con `dotnet ef database update`.
3. Actualizar DTOs y controladores PUT.
4. Actualizar frontend para renderizar alias.
5. Verificar que el bridge, WebSocket y MQTT siguen funcionando con códigos técnicos.

## Open Questions

- ¿Se permite alias vacío (`""`) o se debe normalizar a `null`?
- ¿El alias debe aparecer en notificaciones/alertas futuras?
