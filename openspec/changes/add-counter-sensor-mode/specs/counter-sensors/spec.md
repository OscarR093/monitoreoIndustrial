## ADDED Requirements

### Requirement: Sensor model supports ModoDigital field
The Sensor entity SHALL include a `ModoDigital` field (string, nullable) with values `null` for analog sensors, `"estado"` for state-type digital sensors, and `"contador"` for counter-type digital sensors. Existing digital sensors SHALL default to `"estado"`.

#### Scenario: New analog sensor has null ModoDigital
- **WHEN** a sensor is created with TipoDato="analogico"
- **THEN** ModoDigital SHALL be null

#### Scenario: New digital state sensor
- **WHEN** a sensor is created with TipoDato="digital" and ModoDigital="estado"
- **THEN** the sensor SHALL be persisted with ModoDigital="estado"

#### Scenario: New digital counter sensor
- **WHEN** a sensor is created with TipoDato="digital" and ModoDigital="contador"
- **THEN** the sensor SHALL be persisted with ModoDigital="contador"

#### Scenario: Existing digital sensor defaults to estado
- **WHEN** existing digital sensors without ModoDigital are migrated
- **THEN** their ModoDigital SHALL be set to "estado"

### Requirement: Admin can configure ModoDigital on sensor
Admin and SuperAdmin users SHALL be able to set ModoDigital via PUT /api/sensores/{id}. The controller SHALL validate that TipoDato and ModoDigital are consistent.

#### Scenario: Admin changes state sensor to counter
- **WHEN** an Admin sends PUT /api/sensores/{id} with ModoDigital="contador" and AlarmaEnOn=false, AlarmaEnOff=false
- **THEN** the sensor is updated with the new mode

#### Scenario: Validation rejects mismatched combo
- **WHEN** an update sets TipoDato="analogico" and ModoDigital="estado"
- **THEN** the system SHALL return 400 Bad Request

#### Scenario: Validation rejects counter with alarm flags
- **WHEN** an update sets ModoDigital="contador" and AlarmaEnOn=true
- **THEN** the system SHALL return 400 Bad Request

#### Scenario: Validation rejects estado with range configured
- **WHEN** an update sets ModoDigital="estado" and RangoMinimo is not null
- **THEN** the system SHALL return 400 Bad Request

### Requirement: Bridge sensor definitions include modo field
The bridge sensor configuration SHALL include a `modo` field per sensor: `"analogico"` sensors have no modo, `"digital"` sensors specify `"estado"` or `"contador"`.

#### Scenario: Bridge defines counter sensor
- **WHEN** sensors.py contains `{"id": "c1", "registro": 200, "tipo": "digital", "modo": "contador"}`
- **THEN** the bridge SHALL simulate it as an accumulating counter

#### Scenario: MQTT message includes modo for digital sensors
- **WHEN** the bridge publishes data for a digital sensor
- **THEN** the MQTT message SHALL include `"modo": "estado"` or `"modo": "contador"`

#### Scenario: MQTT message excludes modo for analog sensors
- **WHEN** the bridge publishes data for an analog sensor
- **THEN** the MQTT message SHALL NOT include a `modo` field, or SHALL include `"modo": null`

### Requirement: Bridge simulates counter sensors with accumulating values
The bridge simulation SHALL maintain an integer counter for each contador-type sensor that increments randomly each tick and never decrements. The `cambios` field SHALL reflect the total increments since the last history publication.

#### Scenario: Counter starts at random initialization value
- **WHEN** the simulation starts
- **THEN** each counter sensor SHALL be initialized with a random value between 1000 and 5000

#### Scenario: Counter increments each tick
- **WHEN** the simulation updates a counter sensor
- **THEN** the value SHALL increase by a random amount between 0 and 3

#### Scenario: Counter never decrements
- **WHEN** a counter sensor is updated
- **THEN** the new value SHALL be greater than or equal to the previous value

#### Scenario: Counter cambios accumulates between history cycles
- **WHEN** the history thread reads data after a full cycle
- **THEN** the counter's `cambios` field SHALL equal the total increment since the last history publication

#### Scenario: Cambios resets after history read
- **WHEN** the history thread publishes and the counter resets its delta
- **THEN** subsequent increments SHALL start accumulating from zero for the next cycle

### Requirement: API auto-creates counter sensors with correct widget and unit
When the MQTT subscriber receives a message with `tipo="digital"` and `modo="contador"` for an unknown sensor, it SHALL auto-create the sensor with TipoGraficoId matching the "counter" widget (id=5) and UnidadId matching "ud" (id=8).

#### Scenario: Auto-create counter sensor
- **WHEN** the API receives an MQTT message with `{"sensor":"c1", "tipo":"digital", "modo":"contador", ...}`
- **THEN** a new Sensor SHALL be created with TipoGraficoId=5, UnidadId=8, TipoDato="digital", ModoDigital="contador"

#### Scenario: Auto-create state sensor unchanged
- **WHEN** the API receives an MQTT message with `{"sensor":"d1", "tipo":"digital", "modo":"estado", ...}`
- **THEN** a new Sensor SHALL be created with TipoGraficoId=4 (status), UnidadId=7 (BOOL), ModoDigital="estado"

#### Scenario: Backward compat: missing modo defaults to estado
- **WHEN** the API receives an MQTT message with `{"sensor":"d1", "tipo":"digital"}` and no `modo` field
- **THEN** the sensor SHALL be auto-created with ModoDigital="estado"

### Requirement: DatoSensorMessage deserializes modo field
The DatoSensorMessage class used by the MQTT subscriber SHALL include a `modo` field (string, default `"estado"`) to capture the sensor mode from bridge messages.

#### Scenario: Message with modo contador
- **WHEN** the API receives MQTT payload with `"modo": "contador"`
- **THEN** DatoSensorMessage.modo SHALL be "contador"

#### Scenario: Message without modo defaults to estado
- **WHEN** the API receives MQTT payload without a `modo` field
- **THEN** DatoSensorMessage.modo SHALL default to "estado"

### Requirement: Counter sensor alarm uses range fields instead of binary flags
For sensors with ModoDigital="contador", the alarm SHALL trigger based on RangoMinimo and RangoMaximo (value outside range = warning), and SHALL ignore AlarmaEnOn and AlarmaEnOff.

#### Scenario: Counter within range, no alarm
- **WHEN** a counter sensor has RangoMinimo=1000, RangoMaximo=50000, AlarmaActiva=true, and value is 12000
- **THEN** the alarm SHALL NOT trigger

#### Scenario: Counter above max triggers alarm
- **WHEN** a counter sensor has RangoMinimo=1000, RangoMaximo=50000, AlarmaActiva=true, and value is 60000
- **THEN** the alarm SHALL trigger

#### Scenario: Counter below min triggers alarm
- **WHEN** a counter sensor has RangoMinimo=1000, RangoMaximo=50000, AlarmaActiva=true, and value is 500
- **THEN** the alarm SHALL trigger

#### Scenario: Counter ignores binary alarm flags
- **WHEN** a counter sensor has AlarmaEnOn=true
- **THEN** the AlarmaEnOn flag SHALL NOT affect alarm evaluation

### Requirement: Counter sensor card displays accumulated value
When a sensor has ModoDigital="contador", the SensorCard SHALL display the accumulated integer value with the sensor's unit symbol, a delta indicator showing activations in the current period, and use the "counter" widget (TipoGraficoId=5).

#### Scenario: Counter card shows accumulated value
- **WHEN** a counter sensor has value 1247 and unidad "ud"
- **THEN** the card SHALL display "1,247 ud" prominently

#### Scenario: Counter card shows period delta
- **WHEN** a counter sensor has accumulated cambios data
- **THEN** the card SHALL show the current period's delta (e.g., "+23 hoy")

#### Scenario: Counter card renders counter widget
- **WHEN** a sensor has TipoGraficoId=5 (counter)
- **THEN** the mini-widget SHALL render a large number display, not an ON/OFF indicator or chart

### Requirement: Counter sensor detail modal shows daily bar chart
For sensors with ModoDigital="contador", the detail modal SHALL display a daily bar chart aggregating activations per day when the selected date range spans more than one day.

#### Scenario: Multi-day range shows daily bars
- **WHEN** a user selects a date range of 7 days for a counter sensor
- **THEN** the chart SHALL show 7 bars, one per day, with each bar height representing total activations that day

#### Scenario: Single-day range shows raw data line chart
- **WHEN** a user selects a date range of 1 day or less for a counter sensor
- **THEN** the chart SHALL show the raw accumulated value over time as a line chart

#### Scenario: Counter modal shows tabla with total per day
- **WHEN** the counter detail modal loads multi-day data
- **THEN** the statistics section SHALL include a table with day-by-day activation totals
