## ADDED Requirements

### Requirement: History endpoint supports date range filtering
The GET /api/datos endpoint SHALL accept optional `from` and `to` query parameters (Unix timestamps) to filter data by time range.

#### Scenario: Filter history by date range
- **WHEN** a client requests GET /api/datos?sensorId=1&from=1700000000&to=1700086400
- **THEN** the response SHALL contain only DatoSensor records where Timestamp falls within the specified range

#### Scenario: Date range with no results
- **WHEN** the date range filter matches no records
- **THEN** the response SHALL be an empty array with 200 OK

#### Scenario: Only from parameter provided
- **WHEN** only `from` is provided without `to`
- **THEN** the response SHALL contain records from the specified start time onward

### Requirement: Digital sensor history includes change count
When history records are retrieved for a digital sensor, each record SHALL include the `cambios` field indicating state transitions in that cycle.

#### Scenario: Digital sensor history shows cambios
- **WHEN** a client requests history for a digital sensor
- **THEN** each record in the response SHALL include a `cambios` field

#### Scenario: Analog sensor history has cambios zero
- **WHEN** a client requests history for an analog sensor
- **THEN** each record SHALL have `cambios: 0`

### Requirement: Sensor detail modal shows history with date range
The sensor detail modal SHALL display historical data with a date range selector allowing the user to choose the time window.

#### Scenario: User selects date range in detail modal
- **WHEN** a user opens the sensor detail modal and selects a custom date range
- **THEN** the chart and statistics (min, max, avg) SHALL update to reflect only data within the selected range

#### Scenario: Default date range is last 24 hours
- **WHEN** a user opens the sensor detail modal without selecting a date range
- **THEN** the modal SHALL display data from the last 24 hours

### Requirement: Digital sensor detail modal shows history table
For digital sensors, the detail modal SHALL display a table or timeline view with timestamp, current state (ON/OFF), and change count for each history record.

#### Scenario: Digital sensor history table
- **WHEN** a user opens the detail modal for a digital sensor
- **THEN** the history section SHALL show a table with columns: Timestamp, Estado (ON/OFF indicator), Cambios (transition count)
