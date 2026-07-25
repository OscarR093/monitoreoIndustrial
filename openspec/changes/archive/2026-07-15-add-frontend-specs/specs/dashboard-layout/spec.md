## ADDED Requirements

### Requirement: Dashboard has three structural zones
The dashboard SHALL be composed of a top navigation bar, a sidebar for navigation, and a main content area for sensor display.

#### Scenario: Dashboard loads with all three zones visible
- **WHEN** an authenticated user navigates to `/`
- **THEN** the top bar shows connection status and plant/area selector, the sidebar shows navigation links, and the main area displays sensor cards

#### Scenario: Sidebar collapses on narrow screens
- **WHEN** viewport width is less than 768px
- **THEN** the sidebar collapses to icon-only mode, preserving navigation access

#### Scenario: Sidebar toggles via button
- **WHEN** user clicks the sidebar toggle button
- **THEN** the sidebar expands or collapses between full width and icon-only mode

### Requirement: Main area scrolls independently
The main content area SHALL scroll independently from the top bar and sidebar.

#### Scenario: Scrolling sensor grid
- **WHEN** sensor cards exceed viewport height
- **THEN** only the main area scrolls; top bar and sidebar remain fixed

### Requirement: Top bar displays real-time system status
The top bar SHALL show WebSocket connection status, active alert count, and a plant/area selector.

#### Scenario: WebSocket connected indicator
- **WHEN** WebSocket connection to the API is established
- **THEN** the top bar shows a green indicator with "Conectado" text

#### Scenario: WebSocket disconnected indicator
- **WHEN** WebSocket connection drops
- **THEN** the top bar shows a red indicator with "Desconectado" text and attempts auto-reconnect

#### Scenario: Plant and area selection via top bar
- **WHEN** user selects a plant and area from the top bar dropdowns
- **THEN** sensor data updates to show only sensors in that plant/area
