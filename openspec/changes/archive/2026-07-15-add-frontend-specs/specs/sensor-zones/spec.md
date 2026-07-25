## ADDED Requirements

### Requirement: Sensors are displayed in named groups
The sensor grid SHALL organize sensors into named zones with collapsible headers.

#### Scenario: Zones render with headers
- **WHEN** sensors are loaded for a plant/area
- **THEN** sensors are grouped into zones (e.g., "Temperaturas", "Presiones") with a descriptive header and a collapse toggle

#### Scenario: Zone collapses on header click
- **WHEN** user clicks a zone header
- **THEN** the sensor cards within that zone hide, and the header shows an expand indicator

#### Scenario: Zone expands on header click
- **WHEN** user clicks a collapsed zone header
- **THEN** the sensor cards within that zone become visible again

### Requirement: Zone assignment is configurable
The grouping of sensors into zones SHALL be defined by a configuration that can be modified in the source code.

#### Scenario: Zone configuration is a data structure
- **WHEN** the dashboard loads
- **THEN** sensors are assigned to zones based on a JavaScript object mapping sensor IDs or types to zone names

#### Scenario: Default zone for unassigned sensors
- **WHEN** a sensor is not assigned to any explicit zone
- **THEN** it appears in a default "Otros" or "General" zone

### Requirement: Zones support expand/collapse all
The dashboard SHALL provide a global control to expand or collapse all zones simultaneously.

#### Scenario: Expand all zones
- **WHEN** user clicks "Expandir Todo" button in the toolbar
- **THEN** all collapsed zones expand simultaneously

#### Scenario: Collapse all zones
- **WHEN** user clicks "Colapsar Todo" button in the toolbar
- **THEN** all expanded zones collapse simultaneously, showing only headers

### Requirement: Zones persist collapse state
The collapse state of each zone SHALL persist in localStorage across page reloads.

#### Scenario: Collapsed zone stays collapsed after refresh
- **WHEN** user collapses a zone and refreshes the page
- **THEN** the zone remains collapsed on the new page load

#### Scenario: Persistence is per plant/area
- **WHEN** user collapses zones in plant "p1" and switches to plant "p2"
- **THEN** plant "p2" shows its own saved collapse state (or all expanded by default)
