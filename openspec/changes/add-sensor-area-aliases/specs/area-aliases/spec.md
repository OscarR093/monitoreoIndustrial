## ADDED Requirements

### Requirement: Area model supports editable alias
The system SHALL store an optional `Alias` field on each area that does not affect the bridge identifier.

#### Scenario: Area has no alias
- **WHEN** an area exists without an alias
- **THEN** the API returns `alias: null` and the frontend displays the technical `codigo`

#### Scenario: Area has an alias
- **WHEN** an administrator sets an area alias to "Área de Moldeo"
- **THEN** the API persists the alias and the frontend displays "Área de Moldeo" instead of "a1"

### Requirement: Area alias is editable by administrators
The system SHALL allow SuperAdmin and Admin roles to update the alias of any area.

#### Scenario: Admin updates area alias
- **WHEN** an Admin sends `PUT /api/areas/{id}` with `{ alias: "Línea de Llenado" }`
- **THEN** the area alias is updated and 200 is returned

#### Scenario: Viewer cannot update area alias
- **WHEN** a Viewer sends `PUT /api/areas/{id}` with `{ alias: "..." }`
- **THEN** the system returns 403

### Requirement: Area alias is visible to all authenticated users
The system SHALL expose the area alias in all endpoints that return area data.

#### Scenario: Area list includes alias
- **WHEN** any authenticated user requests `GET /api/areas`
- **THEN** each area object includes its `alias` field

#### Scenario: Location selector shows area alias
- **WHEN** the dashboard renders the plant/area selector
- **THEN** areas are displayed using their alias when available

### Requirement: Area technical identifier remains immutable
The system SHALL NOT allow modification of the area `Codigo` because it is used by the bridge and MQTT topics.

#### Scenario: Admin attempts to change area code
- **WHEN** an Admin sends `PUT /api/areas/{id}` with `{ codigo: "a99" }`
- **THEN** the system ignores the code change and only updates the alias
