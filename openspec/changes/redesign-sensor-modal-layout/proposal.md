## Why

El modal de detalle de sensor tiene 6 secciones lineales con diagnóstico y configuración mezclados en un solo scroll. Los gráficos (line/bar) no muestran valores precisos: sin Y-axis labels, sin tooltips, sin gridlines. No existe tabla de datos para sensores analógicos — el operador no puede consultar valores exactos en timestamps específicos.

## What Changes

- **Tabs:** [Diagnóstico] [Historial] [Configuración] — cada vista enfocada en una tarea
- **Historial enriquecido:** gráfico con Y-axis labels, gridlines, tooltip hover + tabla literal timestamp/valor
- **Diagnóstico:** valor actual grande, stats, conteo de datos, indicador de estado de alarma
- **Configuración:** límites de alarma + tipo/unidad (Admin)

## Capabilities

### Modified Capabilities
<!-- none -->

### New Capabilities
- `sensor-modal-tabs`: Modal con navegación por tabs
- `sensor-data-table`: Tabla literal timestamp/valor para cualquier tipo de sensor

## Impact

- `frontend/src/components/SensorCard.jsx` — reestructuración completa del modal
