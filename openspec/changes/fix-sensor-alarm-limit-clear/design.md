## Context

`SensorDetailModal` usa `useState(rangoMin)` y `useState(rangoMax)` inicializados desde `sensor.rangoMinimo ?? ''`. Al guardar, `handleSaveAlarm` envía `null` al API cuando el input está vacío, y `onSensorUpdate` actualiza el sensor en el Dashboard. Pero el estado local no se reconcilia con el prop actualizado hasta que el modal se cierra y reabre.

## Goals / Non-Goals

**Goals:**
- El input de rango refleja el valor real del sensor tras un save exitoso
- El usuario recibe confirmación visual de que los límites se guardaron/limpiaron
- Existe una forma explícita de limpiar un límite (botón "×")

**Non-Goals:**
- No se modifica la API ni el backend
- No se modifica la lógica de `handleSaveAlarm`

## Decisions

**1. `useEffect` con dependencias en `sensor.rangoMinimo`/`sensor.rangoMaximo`**
- Solo se dispara cuando el prop cambia (post-save). No interfiere con edición del usuario.
- El prop `sensor` se propaga vía `sensorWithAlias = { ...sensor, alias }`, y `sensor` se actualiza en Dashboard tras `onSensorUpdate`.

**2. Botón "×" como clear explícito**
- Pequeño botón dentro del input (absoluto) o al lado
- Alternativa considerada: solo borrar el valor. Rechazada porque el usuario no sabe si vacío = "sin límite" o "no he terminado de escribir".

## Risks

- **[Riesgo] `useEffect` podría sobrescribir ediciones del usuario** → Mitigación: solo se dispara cuando `sensor.rangoMinimo` cambia, lo cual solo ocurre tras un save exitoso, no durante edición.
