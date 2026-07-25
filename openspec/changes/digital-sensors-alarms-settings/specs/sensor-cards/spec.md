## MODIFIED Requirements

### Requirement: Sensor card indicates status by color
The sensor card border SHALL reflect the current value's status against the sensor's configured alarm ranges. For analog sensors, values within [RangoMinimo, RangoMaximo] are normal (green), values outside are warning (amber). For digital sensors, the card SHALL indicate alarm when the value matches the configured AlarmaEnOn or AlarmaEnOff field, showing warning (amber) when AlarmaActiva is true and the value matches the alarm condition. If no ranges or alarm fields are configured, the card SHALL display normal status.

#### Scenario: Analog normal status (green)
- **WHEN** an analog sensor has RangoMinimo=10, RangoMaximo=90, and value is 50
- **THEN** the card SHALL have an emerald/cyan left border

#### Scenario: Analog warning status (amber)
- **WHEN** an analog sensor has RangoMinimo=10, RangoMaximo=90, and value is 95
- **THEN** the card SHALL have an amber left border

#### Scenario: Analog out of range low
- **WHEN** an analog sensor has RangoMinimo=10, RangoMaximo=90, and value is 5
- **THEN** the card SHALL have an amber left border

#### Scenario: No ranges configured shows normal
- **WHEN** an analog sensor has null RangoMinimo or null RangoMaximo
- **THEN** the card SHALL display normal status regardless of value

#### Scenario: Digital alarm ON triggered
- **WHEN** a digital sensor has AlarmaActiva=true, AlarmaEnOn=true, and value is 1
- **THEN** the card SHALL have an amber left border

#### Scenario: Digital no alarm when value doesn't match
- **WHEN** a digital sensor has AlarmaActiva=true, AlarmaEnOn=true, AlarmaEnOff=false, and value is 0
- **THEN** the card SHALL display normal status

#### Scenario: Digital alarm disabled
- **WHEN** a digital sensor has AlarmaActiva=false
- **THEN** the card SHALL display normal status regardless of value

## ADDED Requirements

### Requirement: Digital sensor card renders ON/OFF indicator
When a sensor has TipoDato="digital", the sensor card SHALL display a prominent ON/OFF status indicator instead of a chart widget.

#### Scenario: Digital sensor ON state
- **WHEN** a digital sensor has value 1
- **THEN** the card SHALL display a green circular indicator with the text "ON" or "ACTIVO"

#### Scenario: Digital sensor OFF state
- **WHEN** a digital sensor has value 0
- **THEN** the card SHALL display a gray circular indicator with the text "OFF" or "INACTIVO"

#### Scenario: Digital sensor no data
- **WHEN** a digital sensor has never received data (value is null)
- **THEN** the card SHALL display "--" with a muted appearance

### Requirement: Sensor card passes configured ranges to status logic
The sensor card SHALL read the sensor's RangoMinimo, RangoMaximo, AlarmaActiva, AlarmaEnOn, and AlarmaEnOff fields from the sensor object (not from hardcoded constants) to determine its display status.

#### Scenario: Status uses sensor fields not hardcoded values
- **WHEN** the SensorCard component computes the display status
- **THEN** it SHALL use the sensor's configured range/alarm fields, not the previously hardcoded thresholds of 60 and 80
