## Purpose

TBD — Define the visual behavior and interactivity of individual sensor cards.

## Requirements

### Requirement: Sensor cards render chart based on TipoGraficoId
Each sensor card SHALL display a mini-chart Recharts widget based on the sensor's assigned `TipoGraficoId`.

#### Scenario: Line chart for tipoGraficoId=1
- **WHEN** a sensor has `tipoGraficoId: 1` (línea)
- **THEN** the card renders a sparkline `<LineChart>` showing recent values

#### Scenario: Gauge for tipoGraficoId=2
- **WHEN** a sensor has `tipoGraficoId: 2` (gauge)
- **THEN** the card renders a donut gauge showing the current value relative to a configured range

#### Scenario: Bar chart for tipoGraficoId=3
- **WHEN** a sensor has `tipoGraficoId: 3` (bar)
- **THEN** the card renders a `<BarChart>` showing recent values as bars

### Requirement: Sensor card indicates status by color
The sensor card border SHALL reflect the current value's status against defined thresholds.

#### Scenario: Normal status (green)
- **WHEN** the sensor value is within normal range (default: 0-60)
- **THEN** the card has an emerald/cyan left border or accent

#### Scenario: Warning status (amber)
- **WHEN** the sensor value is in warning range (default: 61-80)
- **THEN** the card has an amber/orange left border or accent

#### Scenario: Critical status (red)
- **WHEN** the sensor value exceeds critical threshold (default: >80)
- **THEN** the card has a red left border or accent and a subtle pulse animation

### Requirement: Sensor card displays real-time value
The sensor card SHALL display the latest real-time value prominently with the unit symbol.

#### Scenario: Value update via WebSocket
- **WHEN** a new realtime value arrives via WebSocket for a sensor
- **THEN** the card's displayed value updates without page refresh

#### Scenario: No data state
- **WHEN** a sensor has never received data
- **THEN** the card shows "--" with the unit symbol and a muted appearance

### Requirement: Sensor card click opens detail view
Clicking a sensor card SHALL open a modal or expanded panel with historical data.

#### Scenario: Click opens detail panel
- **WHEN** user clicks a sensor card
- **THEN** a panel or modal opens showing the sensor's full historical chart, last 24h min/max, and metadata

#### Scenario: Close detail panel
- **WHEN** user clicks outside the detail panel or the close button
- **THEN** the detail panel closes and returns to the grid view

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
