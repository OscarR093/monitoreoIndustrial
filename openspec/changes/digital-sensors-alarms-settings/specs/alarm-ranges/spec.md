## ADDED Requirements

### Requirement: Sensor has configurable alarm range fields
The Sensor entity SHALL include `RangoMinimo` and `RangoMaximo` nullable decimal fields for analog sensors, and `AlarmaActiva` boolean to toggle alarm checking.

#### Scenario: Analog sensor with configured range
- **WHEN** an analog sensor has RangoMinimo=10 and RangoMaximo=90
- **THEN** values within [10, 90] are considered normal, values outside are considered warning

#### Scenario: Sensor with no range configured
- **WHEN** an analog sensor has null RangoMinimo or null RangoMaximo
- **THEN** the alarm SHALL NOT trigger regardless of value, even if AlarmaActiva is true

#### Scenario: AlarmaActiva toggle disables checking
- **WHEN** a sensor has AlarmaActiva=false
- **THEN** the alarm SHALL NOT trigger regardless of range configuration

### Requirement: Admin can configure analog sensor ranges
Admin and SuperAdmin users SHALL be able to set RangoMinimo and RangoMaximo on a sensor via the API.

#### Scenario: Admin updates sensor ranges
- **WHEN** an Admin sends PUT /api/sensores/{id} with valid RangoMinimo and RangoMaximo
- **THEN** the sensor ranges are persisted and returned in subsequent GET requests

#### Scenario: Viewer cannot update sensor ranges
- **WHEN** a Viewer sends PUT /api/sensores/{id} with range values
- **THEN** the system SHALL return 403 Forbidden

#### Scenario: Range validation: min must be less than max
- **WHEN** an update attempts to set RangoMinimo >= RangoMaximo
- **THEN** the system SHALL return 400 Bad Request

### Requirement: Digital sensor alarm uses binary alarm fields
For digital sensors, the alarm SHALL trigger based on `AlarmaEnOn` and `AlarmaEnOff` fields, not range fields.

#### Scenario: Digital alarm on ON state
- **WHEN** a digital sensor has AlarmaEnOn=true, AlarmaActiva=true, and value=1
- **THEN** the alarm SHALL trigger

#### Scenario: Digital alarm on OFF state
- **WHEN** a digital sensor has AlarmaEnOff=true, AlarmaActiva=true, and value=0
- **THEN** the alarm SHALL trigger

#### Scenario: Digital alarm does not trigger on non-configured state
- **WHEN** a digital sensor has AlarmaEnOn=true, AlarmaEnOff=false, AlarmaActiva=true, and value=0
- **THEN** the alarm SHALL NOT trigger

### Requirement: Sensor detail modal exposes alarm configuration
The sensor detail modal SHALL display alarm configuration fields (range inputs for analog, ON/OFF checkboxes for digital) and an AlarmaActiva toggle, editable by Admin/SuperAdmin only.

#### Scenario: Admin sees editable alarm config in detail modal
- **WHEN** an Admin opens the sensor detail modal
- **THEN** the modal SHALL show editable range/checkbox fields and the AlarmaActiva toggle

#### Scenario: Viewer sees read-only alarm config
- **WHEN** a Viewer opens the sensor detail modal
- **THEN** the modal SHALL display current alarm configuration but fields SHALL be disabled
