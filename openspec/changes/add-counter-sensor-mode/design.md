## Context

El sistema ya soporta sensores digitales (TipoDato="digital") con valores 0/1, visualización ON/OFF, y alarmas AlarmaEnOn/AlarmaEnOff. Sin embargo, todos los digitales se comportan como sensores de estado binario. Para aplicaciones MES/OEE (contadores de producción, ciclos, piezas) se necesita un segundo modo: contador acumulativo.

El PLC es la fuente de verdad del contador (registro Modbus que persiste aunque falle todo lo demás). El bridge es stateless: lee el valor actual, calcula el delta desde la última lectura, y lo publica. Si el bridge se cae y vuelve, el delta del primer ciclo tras reconectar será 0, pero el valor acumulado es correcto porque viene del PLC.

## Goals / Non-Goals

**Goals:**
- Distinguir sensores digitales de estado y de contador mediante `ModoDigital`
- Bridge con simulación de contador (incremento acumulativo, campo `modo` en MQTT)
- Auto-creación de sensores contador con widget "counter" y unidad "ud"
- API: agregación diaria de cambios para contadores en rangos multi-día
- Frontend: SensorCard con variante contador, barras diarias en modal
- Alarmas por rango (min/max) para contadores, reutilizando campos existentes
- Backward compat: digitales existentes → ModoDigital="estado"

**Non-Goals:**
- Detección de rollover/reset de contador en PLC real (futuro)
- Contadores con tasa de alarma (ej: >X activaciones/hora)
- Múltiples modos de agregación (solo diario por ahora)
- Sincronización de hora entre PLC y API (el timestamp lo pone el bridge)

## Decisions

### 1. ModoDigital como string nullable en lugar de enum

**Decisión**: Campo `string? ModoDigital` con valores `null` (analógico), `"estado"`, `"contador"`. Mismo patrón que `TipoDato`.

**Alternativa**: Enum con 3 valores. Descartado por consistencia con TipoDato y para evitar conversiones EF-PostgreSQL adicionales.

### 2. Contadores reutilizan RangoMinimo/RangoMaximo para alarmas

**Decisión**: Los sensores contador ignoran AlarmaEnOn/AlarmaEnOff y usan RangoMinimo/RangoMaximo igual que los analógicos. Si el valor acumulado sale del rango → alarma.

**Alternativa**: Nuevos campos dedicados (ContadorMinimo/ContadorMaximo). Descartado porque RangoMinimo/RangoMaximo ya son nullable y el significado es el mismo: "fuera de rango = warning".

**Validación en controller**: Si ModoDigital="contador", AlarmaEnOn y AlarmaEnOff deben ser false. Si ModoDigital="estado", RangoMinimo y RangoMaximo deben ser null. Esto evita configuraciones incoherentes.

### 3. Agregación diaria en DatosController, no en el frontend

**Decisión**: `GET /api/datos?sensorId=X&from=T1&to=T2` devuelve datos crudos normalmente. Para contadores con rango > 1 día, el frontend añade `&agregar=diario` y el endpoint responde con `{ raw: [...], diario: [{dia, total}] }`. El campo `total` es SUM(Cambios) agrupado por día.

**Alternativa**: Endpoint separado `/api/datos/agregado`. Descartado por simplicidad — un parámetro de query es suficiente.

**Alternativa 2**: Hacer la agregación en el frontend. Descartado porque requiere traer todos los datos crudos (potencialmente miles de registros para rangos largos) cuando solo se necesita el total diario.

### 4. Widget "counter" como nuevo TipoGrafico

**Decisión**: Seed `TipoGrafico` id=5, nombre="Contador", widget="counter". La auto-creación asigna id=5 a sensores con modo="contador".

**Alternativa**: Reutilizar widget "status" y diferenciar por ModoDigital en frontend. Descartado — la visualización es radicalmente distinta (número grande vs indicador circular). Un widget separado hace el código más mantenible.

### 5. Bridge: mismo mensaje MQTT, campo `modo` adicional

**Decisión**: El mensaje MQTT gana `"modo": "estado"|"contador"`. Para backward compat, si el campo `modo` está ausente y `tipo` es "digital", se asume "estado". El campo `cambios` mantiene su semántica: incrementos desde el último history.

**Alternativa**: Topic MQTT separado para contadores. Descartado — añade complejidad innecesaria en suscripciones.

### 6. Simulación de contador: incremento aleatorio, sin decremento

**Decisión**: La simulación inicia el contador en un valor aleatorio (1000-5000) y cada tick (2s) incrementa entre 0 y 3 unidades. El contador nunca decrece. Entre ciclos de history (20 min), `cambios` acumula el total de incrementos.

**Alternativa**: Simular un contador de producción real con picos/batch. Descartado — la simulación solo necesita demostrar el comportamiento acumulativo, no ser realista.

### 7. Unidad por defecto para contadores: "ud"

**Decisión**: Seed `Unidad` id=8, nombre="Unidades", símbolo="ud". La auto-creación asigna id=8 a sensores contador. El Admin puede cambiarlo luego.

**Alternativa**: Reutilizar unidad genérica existente. Descartado — ninguna unidad actual ("°C", "PSI", "V", "A", "%", "RPM", "BOOL") es apropiada para un contador de piezas/ciclos.

## Risks / Trade-offs

- **[Counter reset/rollover]**: Si un PLC real resetea su contador, el bridge verá un valor menor al anterior y mandará `cambios=-1` o `cambios=0`. El sistema no detecta rollover aún. Mitigación: documentar que es una limitación conocida, implementar detección en cambio futuro.
- **[Delta 0 tras reconexión]**: Si el bridge se cae y reconecta, el primer ciclo de history tendrá `cambios=0` porque perdió el último valor en RAM. El valor acumulado es correcto (viene del PLC). Mitigación: aceptable, el dato es informativo.
- **[Agregación diaria solo para contadores]**: Si en el futuro se necesita agregación semanal/mensual o para analógicos, habrá que extender el parámetro `agregar`. Por ahora diario cubre el caso de uso MES/OEE.
- **[RangoMinimo/RangoMaximo compartido]**: Un sensor de estado mal configurado podría tener rangos cuando no debe. Mitigación: validación en el controller que rechaza combinaciones inválidas.

## Migration Plan

1. **Migración EF**: Añadir columna `ModoDigital` (varchar(20), nullable) a tabla `Sensores`. UPDATE `ModoDigital='estado'` WHERE `TipoDato='digital'`. Seed TipoGrafico id=5 y Unidad id=8.
2. **Despliegue API**: La API nueva soporta el campo `modo` en MQTT con default "estado". Los sensores existentes funcionan sin cambios.
3. **Despliegue Bridge**: El bridge nuevo envía `modo` en cada mensaje. Si se despliega API antes que bridge, el default "estado" mantiene compatibilidad.
4. **Despliegue Frontend**: El frontend nuevo lee `ModoDigital` del sensor y renderiza la variante adecuada. Sensores sin ModoDigital (analógicos) se comportan igual.
5. **Rollback**: Eliminar columna ModoDigital de la migración Down. El bridge viejo sin campo `modo` sigue funcionando (default "estado").

## Open Questions

- Ninguna pendiente. Todas las decisiones fueron resueltas durante la exploración.
