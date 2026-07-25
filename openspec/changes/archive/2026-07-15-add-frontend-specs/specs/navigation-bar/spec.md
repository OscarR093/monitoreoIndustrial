## ADDED Requirements

### Requirement: Navigation bar shows WebSocket status
The navigation bar SHALL display a connection indicator reflecting the WebSocket state.

#### Scenario: Connected indicator green
- **WHEN** the WebSocket connection to `/ws/realtime` is open
- **THEN** the bar shows a green dot with plugin icon and "Conectado" label

#### Scenario: Reconnecting indicator amber
- **WHEN** the WebSocket disconnects and auto-reconnect is pending
- **THEN** the bar shows an amber pulsing dot with "Reconectando..." label

#### Scenario: Disconnected indicator red
- **WHEN** auto-reconnect has failed after maximum retries
- **THEN** the bar shows a red dot with "Desconectado" label and a manual reconnect button

### Requirement: Navigation bar shows alert summary
The navigation bar SHALL display a count of sensors in warning and critical states.

#### Scenario: Alert count display
- **WHEN** sensors exist with warning or critical values
- **THEN** the bar shows a badge with the count and alert icon

#### Scenario: No alerts
- **WHEN** all sensors are in normal state
- **THEN** the alert badge is hidden or shows "0" in green

### Requirement: Navigation bar includes plant/area selector
The navigation bar SHALL include dropdowns for plant and area selection, replacing the inline selectors in the main content area.

#### Scenario: Plant selector filters areas
- **WHEN** user selects a plant from the dropdown
- **THEN** the area dropdown populates with only that plant's areas

#### Scenario: Selection triggers data refresh
- **WHEN** user selects both plant and area
- **THEN** the WebSocket reconnects to the new plant/area and sensor cards update

### Requirement: Navigation bar shows last update timestamp
The navigation bar SHALL display the time of the most recent real-time data received.

#### Scenario: Timestamp updates on data receipt
- **WHEN** a WebSocket message is received
- **THEN** the timestamp in the navigation bar updates to the current time

#### Scenario: Default timestamp state
- **WHEN** no data has been received yet
- **THEN** the timestamp area is hidden or shows "--:--:--"
