## Why

Los administradores necesitan identificar sensores y áreas con nombres legibles para operadores de planta (ej. "Tanque Norte", "Línea de Empaque 1"), pero el bridge envía identificadores técnicos fijos (p1, a1, s1) que no deben cambiar. Sin alias editables, el dashboard muestra códigos crípticos a todos los usuarios, dificultando la operación diaria y la gestión de alertas.

## What Changes

- **Alias editable para áreas**: SuperAdmin y Admin pueden asignar un nombre descriptivo (`Alias`) a cada área. El código técnico (`Codigo`) del bridge permanece inmutable.
- **Alias editable para sensores**: SuperAdmin y Admin pueden asignar un nombre descriptivo (`Alias`) a cada sensor. El identificador técnico (`SensorId`) del bridge permanece inmutable.
- **Persistencia en PostgreSQL**: nuevas columnas `Alias` en `Area` y `Sensor`.
- **Visibilidad en todos los niveles**: dashboard, tarjetas, zonas, detalle de sensor y gestión de usuarios usan el alias cuando existe; si no existe, se muestra el identificador técnico.
- **API REST protegida**: endpoints `PUT /api/areas/{id}` y `PUT /api/sensores/{id}` permiten editar solo el alias a roles Admin/SuperAdmin. Viewer no puede modificar.
- **Frontend**: el dashboard y las tarjetas muestran alias; el formulario de edición de sensor/área es accesible para administradores.

## Capabilities

### New Capabilities
- `sensor-aliases`: Alias editable para sensores con persistencia y visibilidad universal.
- `area-aliases`: Alias editable para áreas con persistencia y visibilidad universal.

### Modified Capabilities
- `sensor-cards`: Los requisitos de visualización de tarjetas ahora deben usar el alias del sensor cuando exista.
- `sensor-zones`: Los requisitos de agrupación de sensores ahora deben usar el alias del sensor cuando exista.
- `dashboard-layout`: El selector de ubicación (planta/área) debe mostrar el alias del área cuando exista.

## Impact

- **API (.NET)**: migraciones EF en `Area` y `Sensor`; actualización de DTOs; endpoints PUT para editar alias; seed y lógica de filtrado ajustada.
- **Frontend (React)**: `SensorCard`, `SensorZone`, `NavigationBar`, `Dashboard`, `UserManagement` y modal de detalle deben leer y mostrar `alias`.
- **Bridge**: sin cambios; sigue usando códigos técnicos.
- **MQTT/WebSocket**: sin cambios; topics siguen basados en `p1`, `a1`, `s1`.
- **Tests**: xUnit debe validar que el alias se devuelve y se actualiza; Playwright debe verificar que el alias se renderiza.
