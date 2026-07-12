## ADDED Requirements

### Requirement: Role hierarchy definition
The system SHALL define three hierarchical roles: SuperAdmin, Admin, and Viewer, with SuperAdmin having the highest privileges and Viewer the lowest.

#### Scenario: Role values
- **WHEN** a user is created
- **THEN** the `Rol` field MUST be one of `"superadmin"`, `"admin"`, or `"viewer"`

### Requirement: Sensor CRUD restricted to SuperAdmin and Admin
The system SHALL restrict sensor creation, modification, and deletion to SuperAdmin and Admin roles.

#### Scenario: SuperAdmin creates a sensor
- **WHEN** a SuperAdmin sends `POST /api/sensores`
- **THEN** the sensor is created and 201 is returned

#### Scenario: Admin edits a sensor
- **WHEN** an Admin sends `PUT /api/sensores/{id}`
- **THEN** the sensor is updated and 200 is returned

#### Scenario: Viewer cannot create a sensor
- **WHEN** a Viewer sends `POST /api/sensores`
- **THEN** the system returns 403

#### Scenario: Viewer cannot delete a sensor
- **WHEN** a Viewer sends `DELETE /api/sensores/{id}`
- **THEN** the system returns 403

### Requirement: Data read access for all authenticated users
The system SHALL allow all authenticated users (SuperAdmin, Admin, Viewer) to read sensor data, plants, areas, types, and units.

#### Scenario: Viewer reads sensor list
- **WHEN** a Viewer sends `GET /api/sensores`
- **THEN** the system returns the list of sensors

#### Scenario: Viewer reads historical data
- **WHEN** a Viewer sends `GET /api/datos`
- **THEN** the system returns historical sensor data

#### Scenario: Unauthenticated user cannot read data
- **WHEN** an unauthenticated request is made to `GET /api/datos`
- **THEN** the system returns 401

### Requirement: Dashboard personalization access
The system SHALL allow all authenticated users to personalize their own dashboard view.

#### Scenario: Viewer customizes their dashboard
- **WHEN** a Viewer changes chart type or sensor grouping in their dashboard
- **THEN** the system persists the customization for that user only

#### Scenario: Dashboard customization is per-user
- **WHEN** an Admin customizes their dashboard
- **THEN** the customization does not affect any other user's dashboard

### Requirement: WebSocket authorization
The system SHALL validate the JWT cookie before accepting WebSocket connections.

#### Scenario: Authenticated WebSocket connection
- **WHEN** a browser with a valid JWT cookie connects to `/ws/realtime?planta=p1&area=a1`
- **THEN** the WebSocket upgrade is accepted and realtime data is forwarded

#### Scenario: Unauthenticated WebSocket connection rejected
- **WHEN** a browser without a valid JWT cookie connects to `/ws/realtime`
- **THEN** the system returns 401 and does not upgrade the connection

### Requirement: Role-based endpoint protection
All existing REST endpoints SHALL be protected with `[Authorize]` attribute, with role-specific restrictions where applicable.

#### Scenario: Unauthenticated access to protected endpoints
- **WHEN** a request without a valid JWT targets any endpoint except `/api/auth/login`
- **THEN** the system returns 401

#### Scenario: Endpoints by role requirement
- **WHEN** endpoints are registered
- **THEN** `GET` endpoints for data reading SHALL require any authenticated role, and `POST`/`PUT`/`DELETE` endpoints for sensor/configuration management SHALL require Admin or SuperAdmin role
