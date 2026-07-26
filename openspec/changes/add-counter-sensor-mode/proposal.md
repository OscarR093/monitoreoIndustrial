## Why

El cambio `digital-sensors-alarms-settings` introdujo sensores digitales pero los trató como un solo tipo genérico (0/1 con cambios de estado). En automatización industrial real existen dos tipos de entradas digitales: las de **estado** (binarias, ON/OFF) y las de **contador** (acumuladores de pulsos para MES/OEE). Sin esta distinción, el sistema no puede modelar correctamente contadores de producción, ciclos de máquina o piezas rechazadas — datos fundamentales para dashboards de eficiencia operacional.

## What Changes

- **Sensor.cs** gana `ModoDigital` (string, nullable): `null` para analógicos, `"estado"` o `"contador"` para digitales. Digitales existentes migran a `"estado"`.
- **SensoresController PUT** permite editar `ModoDigital` con validación: analógico→null, digital→"estado"|"contador".
- **Bridge**: `sensors.py` añade campo `modo` por sensor. `plc_simulation.py` implementa lógica de contador (incremento acumulado, nunca decrece). MQTT message incluye `modo`.
- **DatoSensorMessage** gana campo `modo` (default `"estado"` para backward compat).
- **MqttSubscriberService** auto-crea sensores contador con `TipoGraficoId=5` (counter) y `UnidadId=8` (ud) en vez del widget "status".
- **DatosController GET**: para sensores contador y rangos multi-día, devuelve agregación diaria (`diario: [{dia, total}]`) además de datos crudos.
- **AlarmService**: contadores usan `RangoMinimo`/`RangoMaximo` para alarmas (fuera de rango = warning), igual que analógicos. Sensores de estado mantienen `AlarmaEnOn`/`AlarmaEnOff`.
- **Seed data**: `TipoGrafico` id=5 ("Contador", widget="counter"), `Unidad` id=8 ("Unidades", símbolo="ud").
- **Frontend SensorCard**: variante contador muestra valor acumulado con delta del periodo actual. Widget "counter" con barra diaria en modal.
- **Frontend SensorDetailModal**: contadores muestran gráfica de línea (acumulado) + barras diarias al seleccionar rango > 1 día.
- **Frontend Dashboard**: alertCount para contadores evalúa RangoMinimo/RangoMaximo.

## Capabilities

### New Capabilities
- `counter-sensors`: Sensores digitales en modo contador. El bridge mantiene un acumulador que nunca decrece, publica valor + incremento entre ciclos. El frontend muestra valor acumulado con gráfica de línea, barras diarias para rangos > 1 día, y alarmas por rango (min/max). Auto-creación asigna widget "counter" y unidad "ud".

### Modified Capabilities
- `digital-sensors`: El modelo digital existente gana `ModoDigital` para distinguir estado de contador. El valor "digital" en MQTT ahora se complementa con el campo `modo`.
- `sensor-cards`: SensorCard discrimina tres variantes (analógico, digital estado, digital contador) en vez de dos. Contador muestra valor acumulado + delta.
- `alarm-ranges`: Contadores reutilizan `RangoMinimo`/`RangoMaximo` para alarmas, en lugar de `AlarmaEnOn`/`AlarmaEnOff` que son exclusivas de estado.
- `sensor-history`: DatosController GET gana modo de agregación diaria para contadores cuando el rango abarca múltiples días.

## Impact

- **Modelos**: Sensor (+1 campo `ModoDigital`), migración EF requerida (columna nullable, default null)
- **API**: SensoresController (PUT extendido), DatosController (GET con agregación diaria), MqttSubscriberService (auto-creación condicional)
- **Servicios**: AlarmService (nueva rama contador), DatoSensorMessage (+modo)
- **Bridge**: sensors.py (+modo), plc_simulation.py (nuevo comportamiento contador)
- **Frontend**: SensorCard (+variante contador), SensorDetailModal (+barras diarias), Dashboard (alertCount para contadores), api.js (+parámetro agregado)
- **Seed**: TipoGrafico id=5, Unidad id=8
- **No es breaking**: digitales existentes migran a `ModoDigital="estado"`, comportamiento idéntico al actual. Bridge viejo sin campo `modo` → default "estado".
