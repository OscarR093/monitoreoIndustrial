## MODIFIED Requirements

### Requirement: History endpoint supports date range filtering and daily aggregation
The GET /api/datos endpoint SHALL accept optional `from` and `to` query parameters (Unix timestamps) to filter data by time range. For counter-type sensors (ModoDigital="contador"), it SHALL also accept an optional `agregar` parameter with value `diario` to return daily aggregation totals alongside raw data.

#### Scenario: Filter history by date range
- **WHEN** a client requests GET /api/datos?sensorId=1&from=1700000000&to=1700086400
- **THEN** the response SHALL contain only DatoSensor records where Timestamp falls within the specified range

#### Scenario: Date range with no results
- **WHEN** the date range filter matches no records
- **THEN** the response SHALL be an empty array with 200 OK

#### Scenario: Only from parameter provided
- **WHEN** only `from` is provided without `to`
- **THEN** the response SHALL contain records from the specified start time onward

#### Scenario: Counter sensor daily aggregation
- **WHEN** a client requests GET /api/datos?sensorId=5&from=T1&to=T2&agregar=diario for a counter sensor spanning 3 days
- **THEN** the response SHALL include a `diario` array with objects containing `dia` (YYYY-MM-DD) and `total` (SUM of cambios for that day)

#### Scenario: Aggregation requested for non-counter sensor
- **WHEN** a client requests aggregation for an analog or state sensor
- **THEN** the `agregar` parameter SHALL be ignored and only raw data SHALL be returned

#### Scenario: Single-day range counter with aggregation
- **WHEN** a counter sensor query spans only one day with agregar=diario
- **THEN** the `diario` array SHALL contain a single day entry with the day's total

### Requirement: Counter sensor history includes change count
When history records are retrieved for a counter sensor, each record SHALL include the `cambios` field indicating the number of count increments in that cycle, and the `valor` field indicating the accumulated counter value at that timestamp.

#### Scenario: Counter sensor history shows accumulated value and cambios
- **WHEN** a client requests history for a counter sensor
- **THEN** each record SHALL include `valor` (accumulated count) and `cambios` (increments in that cycle)

#### Scenario: Analog sensor history has cambios zero
- **WHEN** a client requests history for an analog sensor
- **THEN** each record SHALL have `cambios: 0`

### Requirement: Counter sensor detail modal shows daily bar chart and history line chart
For sensors with ModoDigital="contador", the detail modal SHALL display a daily bar chart (total activations per day) when the date range spans more than one day, and a line chart (accumulated value over time) when the range is one day or less.

#### Scenario: Multi-day counter range shows bars
- **WHEN** a user selects a 7-day range for a counter sensor
- **THEN** the chart SHALL show daily activation totals as bars, with an optional accumulated line overlay

#### Scenario: Single-day counter range shows line
- **WHEN** a user selects a single-day range for a counter sensor
- **THEN** the chart SHALL show the accumulated value over time as a line chart

#### Scenario: Counter modal statistics show daily totals table
- **WHEN** a user views multi-day data for a counter sensor
- **THEN** the statistics section SHALL include a table with columns: Día, Activaciones, Valor acumulado al final del día
