## ADDED Requirements

### Requirement: Sensor card displays sensor alias
The sensor card SHALL display the sensor's alias when it exists; otherwise it SHALL display the technical `sensorId`.

#### Scenario: Card shows alias for named sensor
- **WHEN** a sensor has `alias: "Tanque Norte"`
- **THEN** the card title shows "Tanque Norte" instead of the technical identifier

#### Scenario: Card falls back to sensorId when no alias
- **WHEN** a sensor has no alias
- **THEN** the card title shows the technical `sensorId`

#### Scenario: Detail modal shows alias
- **WHEN** user opens the detail modal for a sensor with an alias
- **THEN** the modal header displays the alias and the technical `sensorId` as metadata
