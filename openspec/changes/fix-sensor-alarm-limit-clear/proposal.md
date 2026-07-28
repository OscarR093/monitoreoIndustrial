## Why

Al configurar límites de alarma (rangoMin, rangoMax) en el modal de detalle de sensor, una vez establecido un valor numérico no es posible volver a "Sin límite". El input se vacía visualmente pero el estado local del modal no refleja el cambio tras guardar: el usuario no recibe confirmación visual y el campo parece ignorar la acción de limpiar.

**Causa raíz:** El estado local (`useState`) del modal es un fork unidireccional del prop `sensor`. Se inicializa desde el prop al montar, pero nunca se reconcilia cuando el prop cambia tras un `PUT` exitoso. El dato se guarda correctamente en la API, pero el modal no lo refleja en la misma sesión.

## What Changes

- Agregar `useEffect` que sincroniza `sensor.rangoMinimo`/`sensor.rangoMaximo` → `rangoMin`/`rangoMax` cuando el prop cambia
- Agregar feedback visual post-save usando `useToast` ("Configuración guardada")
- Agregar botón "×" junto a cada input de rango para limpiar explícitamente el límite

## Capabilities

### Modified Capabilities
<!-- No existing specs to modify -->

### New Capabilities
- `alarm-limit-reset`: Permitir limpiar límites de alarma existentes con feedback visual

## Impact

- `frontend/src/components/SensorCard.jsx` — `useEffect` de sync, `useToast`, botón de clear
