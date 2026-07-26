## MODIFIED Requirements

### Requirement: Sensor has configurable alarm range fields
The Sensor entity SHALL include `RangoMinimo` and `RangoMaximo` nullable decimal fields for analog sensors and counter-type digital sensors, and `AlarmaActiva` boolean to toggle alarm checking. State-type digital sensors SHALL use `AlarmaEnOn`/`AlarmaEnOff` instead.

#### Scenario: Analog sensor with configured range
- **WHEN** an analog sensor has RangoMinimo=10 and RangoMaximo=90
- **THEN** values within [10, 90] are considered normal, values outside are considered warning

#### Scenario: Counter sensor with configured range
- **WHEN** a counter sensor has RangoMinimo=1000 and RangoMaximo=50000
- **THEN** accumulated values within [1000, 50000] are considered normal, values outside are considered warning

#### Scenario: Sensor with no range configured
- **WHEN** an analog or counter sensor has null RangoMinimo or null RangoMaximo
- **THEN** the alarm SHALL NOT trigger regardless of value, even if AlarmaActiva is true

#### Scenario: AlarmaActiva toggle disables checking
- **WHEN** a sensor has AlarmaActiva=false
- **THEN** the alarm SHALL NOT trigger regardless of range or alarm configuration

### Requirement: Digital sensor alarm uses mode-appropriate fields
For sensors with ModoDigital="estado", the alarm SHALL trigger based on `AlarmaEnOn` and `AlarmaEnOff`. For sensors with ModoDigital="contador", the alarm SHALL trigger based on `RangoMinimo` and `RangoMaximo`.

#### Scenario: State digital alarm on ON state
- **WHEN** a state digital sensor has AlarmaEnOn=true, AlarmaActiva=true, and value=1
- **THEN** the alarm SHALL trigger

#### Scenario: State digital alarm on OFF state
- **WHEN** a state digital sensor has AlarmaEnOff=true, AlarmaActiva=true, and value=0
- **THEN** the alarm SHALL trigger

#### Scenario: State digital alarm does not trigger on non-configured state
- **WHEN** a state digital sensor has AlarmaEnOn=true, AlarmaEnOff=false, AlarmaActiva=true, and value=0
- **THEN** the alarm SHALL NOT trigger

#### Scenario: Counter alarm when value below minimum
- **WHEN** a counter sensor has RangoMinimo=1000, RangoMaximo=50000, AlarmaActiva=true, and value=500
- **THEN** the alarm SHALL trigger

#### Scenario: Counter alarm when value above maximum
- **WHEN** a counter sensor has RangoMinimo=1000, RangoMaximo=50000, AlarmaActiva=true, and value=60000
- **THEN** the alarm SHALL trigger

#### Scenario: Counter ignores binary alarm flags
- **WHEN** a counter sensor has AlarmaEnOn=true and value=1
- **THEN** the AlarmaEnOn flag SHALL NOT cause an alarm

### Requirement: Sensor detail modal exposes alarm configuration
The sensor detail modal SHALL display alarm configuration fields adapted to the sensor's ModoDigital: range inputs for analog and counter sensors, ON/OFF checkboxes for state digital sensors, and an AlarmaActiva toggle for all. Fields SHALL be editable by Admin/SuperAdmin only.

#### Scenario: Admin sees editable alarm config for counter sensor
- **WHEN** an Admin opens the detail modal for a counter sensor
- **THEN** the modal SHALL show editable RangoMinimo/RangoMaximo inputs and AlarmaActiva toggle, without ON/OFF checkboxes

#### Scenario: Admin sees editable alarm config for state sensor
- **WHEN** an Admin opens the detail modal for a state digital sensor
- **THEN** the modal SHALL show editable AlarmaEnOn/AlarmaEnOff checkboxes and AlarmaActiva toggle

#### Scenario: Viewer sees read-only alarm config
- **WHEN** a Viewer opens the sensor detail modal
- **THEN** the modal SHALL display current alarm configuration but fields SHALL be disabled
