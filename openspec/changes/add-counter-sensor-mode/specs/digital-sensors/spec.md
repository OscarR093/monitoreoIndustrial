## MODIFIED Requirements

### Requirement: Sensor model supports digital data type
The Sensor entity SHALL include a `TipoDato` field with values `"analogico"` or `"digital"`, defaulting to `"analogico"` for backward compatibility. For digital sensors, the `ModoDigital` field SHALL further distinguish between `"estado"` (binary state) and `"contador"` (accumulating counter).

#### Scenario: New sensor defaults to analogico
- **WHEN** a sensor is created without specifying TipoDato
- **THEN** the sensor's TipoDato SHALL be `"analogico"` and ModoDigital SHALL be null

#### Scenario: Sensor created with explicit digital type
- **WHEN** an Admin creates a sensor with `TipoDato: "digital"` and `ModoDigital: "estado"`
- **THEN** the sensor SHALL be persisted with TipoDato `"digital"` and ModoDigital `"estado"`

#### Scenario: Sensor created as counter
- **WHEN** an Admin creates a sensor with `TipoDato: "digital"` and `ModoDigital: "contador"`
- **THEN** the sensor SHALL be persisted with TipoDato `"digital"` and ModoDigital `"contador"`

### Requirement: Sensor model supports digital alarm fields
The Sensor entity SHALL include `AlarmaEnOn` and `AlarmaEnOff` boolean fields for state-type digital alarm configuration. Counter-type sensors (ModoDigital="contador") SHALL use `RangoMinimo`/`RangoMaximo` instead and SHALL NOT have AlarmaEnOn or AlarmaEnOff set to true.

#### Scenario: Both alarm fields can be false
- **WHEN** AlarmaEnOn is false AND AlarmaEnOff is false
- **THEN** the sensor has no digital alarm configured

#### Scenario: Only AlarmaEnOn is true
- **WHEN** ModoDigital is "estado", AlarmaEnOn is true, and AlarmaEnOff is false
- **THEN** the alarm triggers when the sensor value equals 1

#### Scenario: Only AlarmaEnOff is true
- **WHEN** ModoDigital is "estado", AlarmaEnOff is true, and AlarmaEnOn is false
- **THEN** the alarm triggers when the sensor value equals 0

#### Scenario: Both alarm fields cannot be true simultaneously
- **WHEN** an update attempts to set both AlarmaEnOn AND AlarmaEnOff to true
- **THEN** the system SHALL reject the request with a 400 Bad Request error

### Requirement: MQTT message includes sensor type and mode for auto-creation
Every MQTT message from the bridge SHALL include a `tipo` field (`"analogico"` or `"digital"`) so the API can correctly auto-create new sensors. For digital sensors, the message SHALL also include a `modo` field (`"estado"` or `"contador"`).

#### Scenario: Bridge sends analog sensor data
- **WHEN** the bridge publishes data for an analog sensor
- **THEN** the message SHALL include `tipo: "analogico"`

#### Scenario: Bridge sends digital state sensor data
- **WHEN** the bridge publishes data for a state-type digital sensor
- **THEN** the message SHALL include `tipo: "digital"` and `modo: "estado"`

#### Scenario: Bridge sends digital counter sensor data
- **WHEN** the bridge publishes data for a counter-type digital sensor
- **THEN** the message SHALL include `tipo: "digital"` and `modo: "contador"`
