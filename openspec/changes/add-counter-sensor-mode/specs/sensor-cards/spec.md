## MODIFIED Requirements

### Requirement: Sensor card indicates status by color
The sensor card border SHALL reflect the current value's status against the sensor's configured alarm ranges. For analog sensors, values within [RangoMinimo, RangoMaximo] are normal (green), values outside are warning (amber). For digital state sensors (ModoDigital="estado"), the card SHALL indicate alarm when the value matches the configured AlarmaEnOn or AlarmaEnOff field, showing warning (amber) when AlarmaActiva is true and the value matches the alarm condition. For digital counter sensors (ModoDigital="contador"), the card SHALL indicate alarm when the value falls outside RangoMinimo/RangoMaximo, same as analog sensors. If no ranges or alarm fields are configured, the card SHALL display normal status.

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

#### Scenario: Digital state alarm ON triggered
- **WHEN** a state digital sensor has AlarmaActiva=true, AlarmaEnOn=true, and value is 1
- **THEN** the card SHALL have an amber left border

#### Scenario: Digital state no alarm when value doesn't match
- **WHEN** a state digital sensor has AlarmaActiva=true, AlarmaEnOn=true, AlarmaEnOff=false, and value is 0
- **THEN** the card SHALL display normal status

#### Scenario: Digital state alarm disabled
- **WHEN** a state digital sensor has AlarmaActiva=false
- **THEN** the card SHALL display normal status regardless of value

#### Scenario: Counter within range shows normal
- **WHEN** a counter sensor has RangoMinimo=1000, RangoMaximo=50000, AlarmaActiva=true, and value is 12000
- **THEN** the card SHALL display normal status

#### Scenario: Counter out of range shows warning
- **WHEN** a counter sensor has RangoMinimo=1000, RangoMaximo=50000, AlarmaActiva=true, and value is 60000
- **THEN** the card SHALL have an amber left border

## ADDED Requirements

### Requirement: Counter sensor card renders accumulated value with delta
When a sensor has ModoDigital="contador", the sensor card SHALL display the accumulated count as a large number with unit, a delta indicator for the current period, and use the "counter" widget (TipoGraficoId=5) instead of the ON/OFF indicator.

#### Scenario: Counter card shows accumulated count
- **WHEN** a counter sensor has value 1247 and unidad "ud"
- **THEN** the card SHALL prominently display "1,247 ud"

#### Scenario: Counter card shows period delta
- **WHEN** the counter has received realtime data
- **THEN** the card SHALL show the current period's cambio count (e.g., "+23 hoy")

#### Scenario: Counter card renders counter widget
- **WHEN** a sensor has TipoGraficoId=5 (counter)
- **THEN** the mini-widget SHALL render the large number with delta indicator

#### Scenario: Counter card no data
- **WHEN** a counter sensor has never received data
- **THEN** the card SHALL display "--" with a muted appearance

### Requirement: Counter sensor detail modal shows daily bar chart
For sensors with ModoDigital="contador", the detail modal SHALL display a daily bar chart when the selected date range spans more than one day, and a line chart for single-day ranges.

#### Scenario: Multi-day range shows daily bars
- **WHEN** a user selects a 7-day range for a counter sensor
- **THEN** the chart SHALL show daily activation totals as bars

#### Scenario: Single-day range shows line chart
- **WHEN** a user selects a single-day range for a counter sensor
- **THEN** the chart SHALL show the accumulated value over time as a line

#### Scenario: Counter detail modal shows alarm config as range
- **WHEN** an Admin opens the detail modal for a counter sensor
- **THEN** the alarm section SHALL show RangoMinimo/RangoMaximo inputs (not ON/OFF checkboxes)
