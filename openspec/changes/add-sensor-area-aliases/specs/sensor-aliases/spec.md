## ADDED Requirements

### Requirement: Sensor model supports editable alias
The system SHALL store an optional `Alias` field on each sensor that does not affect the bridge identifier.

#### Scenario: Sensor has no alias
- **WHEN** a sensor exists without an alias
- **THEN** the API returns `alias: null` and the frontend displays the technical `sensorId`

#### Scenario: Sensor has an alias
- **WHEN** an administrator sets a sensor alias to "Tanque Norte"
- **THEN** the API persists the alias and the frontend displays "Tanque Norte" instead of the technical `sensorId`

### Requirement: Sensor alias is editable by administrators
The system SHALL allow SuperAdmin and Admin roles to update the alias of any sensor.

#### Scenario: Admin updates sensor alias
- **WHEN** an Admin sends `PUT /api/sensores/{id}` with `{ alias: "Línea Empaque 1" }`
- **THEN** the sensor alias is updated and 200 is returned

#### Scenario: Viewer cannot update sensor alias
- **WHEN** a Viewer sends `PUT /api/sensores/{id}` with `{ alias: "..." }`
- **THEN** the system returns 403

### Requirement: Sensor alias is visible to all authenticated users
The system SHALL expose the sensor alias in all endpoints that return sensor data.

#### Scenario: Sensor list includes alias
- **WHEN** any authenticated user requests `GET /api/sensores`
- **THEN** each sensor object includes its `alias` field

#### Scenario: Realtime data preserves technical identifier
- **WHEN** realtime data arrives via WebSocket for sensor "s1"
- **THEN** the frontend matches the message to the sensor using `sensorId` and displays the alias if present

### Requirement: Sensor alias is unique per plant and area
The system SHALL allow the same alias text in different contexts as long as the technical `sensorId` remains unique.

#### Scenario: Two sensors share alias in different areas
- **WHEN** two sensors in different areas both have alias "Temperatura"
- **THEN** both aliases are persisted and displayed without conflict
