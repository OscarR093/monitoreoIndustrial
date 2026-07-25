## 1. Modelos y Migraciones

- [x] 1.1 Agregar propiedad `Alias` nullable a `Models/Sensor.cs`
- [x] 1.2 Agregar propiedad `Alias` nullable a `Models/Area.cs`
- [x] 1.3 Crear migración EF `AddSensorAndAreaAliases`
- [x] 1.4 Aplicar migración con `dotnet ef database update`

## 2. API: DTOs y Controladores

- [x] 2.1 Incluir `Alias` en DTOs de `SensoresController` y `AreasController`
- [x] 2.2 Actualizar `PUT /api/sensores/{id}` para permitir editar alias (ignorar SensorId, PlantaId, AreaId)
- [x] 2.3 Actualizar `PUT /api/areas/{id}` para permitir editar alias (ignorar Codigo, PlantaId)
- [x] 2.4 Validar que rol Viewer recibe 403 en PUT de sensores y áreas
- [x] 2.5 Actualizar seed de sensores/áreas si aplica

## 3. Frontend: Servicios y Helpers

- [x] 3.1 Crear helper `getDisplayName(sensor)` que retorne `alias || sensorId`
- [x] 3.2 Crear helper `getAreaDisplayName(area)` que retorne `alias || codigo`
- [x] 3.3 Actualizar `api.js` si se agregan endpoints específicos de edición

## 4. Frontend: Visualización de Alias

- [x] 4.1 Mostrar alias en `SensorCard` (título y detalle)
- [x] 4.2 Mostrar alias en `SensorZone` (cards internas)
- [x] 4.3 Mostrar alias en `LocationSelector` (dropdown de áreas)
- [x] 4.4 Mostrar alias en detalle de sensor (modal)

## 5. Frontend: Edición de Alias (Admin/SuperAdmin)

- [x] 5.1 Agregar botón/icono de edición en `SensorCard` para roles Admin+
- [x] 5.2 Crear modal/formulario inline para editar alias de sensor
- [x] 5.3 Crear página/formulario para editar alias de área (o integrar en settings futuro)
- [x] 5.4 Llamar a `PUT /api/sensores/{id}` y `PUT /api/areas/{id}` desde el frontend

## 6. Tests

- [x] 6.1 Agregar tests xUnit para alias en GET/PUT de sensores
- [x] 6.2 Agregar tests xUnit para alias en GET/PUT de áreas
- [ ] 6.3 Actualizar tests Playwright para verificar alias renderizado
- [x] 6.4 Verificar que bridge, MQTT y WebSocket siguen usando identificadores técnicos
