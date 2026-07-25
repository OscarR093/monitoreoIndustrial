## ADDED Requirements

### Requirement: Sensor model supports digital data type
The Sensor entity SHALL include a `TipoDato` field with values `"analogico"` or `"digital"`, defaulting to `"analogico"` for backward compatibility.

#### Scenario: New sensor defaults to analogico
- **WHEN** a sensor is created without specifying TipoDato
- **THEN** the sensor's TipoDato SHALL be `"analogico"`

#### Scenario: Sensor created with explicit digital type
- **WHEN** an Admin creates a sensor with `TipoDato: "digital"`
- **THEN** the sensor SHALL be persisted with TipoDato `"digital"`

### Requirement: Sensor model supports digital alarm fields
The Sensor entity SHALL include `AlarmaEnOn` and `AlarmaEnOff` boolean fields for digital alarm configuration.

#### Scenario: Both alarm fields can be false
- **WHEN** AlarmaEnOn is false AND AlarmaEnOff is false
- **THEN** the sensor has no digital alarm configured

#### Scenario: Only AlarmaEnOn is true
- **WHEN** AlarmaEnOn is true AND AlarmaEnOff is false
- **THEN** the alarm triggers when the sensor value equals 1

#### Scenario: Only AlarmaEnOff is true
- **WHEN** AlarmaEnOff is true AND AlarmaEnOn is false
- **THEN** the alarm triggers when the sensor value equals 0

#### Scenario: Both alarm fields cannot be true simultaneously
- **WHEN** an update attempts to set both AlarmaEnOn AND AlarmaEnOff to true
- **THEN** the system SHALL reject the request with a 400 Bad Request error

### Requirement: Bridge reports digital sensor changes per cycle
The bridge SHALL track state transitions (0→1 or 1→0) for digital sensors and report the accumulated count in each history cycle message.

#### Scenario: History cycle includes change count
- **WHEN** the bridge history thread publishes data for a digital sensor
- **THEN** the MQTT message SHALL include `cambios` equal to the number of state transitions since the last history publication

#### Scenario: Realtime cycle excludes change count
- **WHEN** the bridge realtime thread publishes data for a digital sensor
- **THEN** the MQTT message SHALL include `cambios: 0`

#### Scenario: Counter resets after history publication
- **WHEN** the history thread publishes and resets the counter
- **THEN** the next history cycle SHALL start counting from zero

### Requirement: MQTT message includes sensor type for auto-creation
Every MQTT message from the bridge SHALL include a `tipo` field (`"analogico"` or `"digital"`) so the API can correctly auto-create new sensors.

#### Scenario: Bridge sends analog sensor data
- **WHEN** the bridge publishes data for an analog sensor
- **THEN** the message SHALL include `tipo: "analogico"`

#### Scenario: Bridge sends digital sensor data
- **WHEN** the bridge publishes data for a digital sensor
- **THEN** the message SHALL include `tipo: "digital"`

### Requirement: DatoSensor stores change count for digital sensors
The DatoSensor entity SHALL include a `Cambios` field (integer, default 0) to store the number of state transitions reported by the bridge.

#### Scenario: Digital history record stores cambios
- **WHEN** the API receives a history message with `cambios: 5` for a digital sensor
- **THEN** the DatoSensor record SHALL have `Cambios: 5`

#### Scenario: Analog record has cambios zero
- **WHEN** the API receives any message for an analog sensor
- **THEN** the DatoSensor record SHALL have `Cambios: 0`
