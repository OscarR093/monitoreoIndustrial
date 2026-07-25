## ADDED Requirements

### Requirement: Sensor zones display sensor aliases
The sensor grid SHALL display sensors using their alias when available, both in card titles and zone headers.

#### Scenario: Zone card title uses alias
- **WHEN** a sensor inside a zone has an alias
- **THEN** the card title shows the alias instead of the technical identifier

#### Scenario: Sensor matching uses technical identifier
- **WHEN** realtime data arrives for sensor "s1" but its alias is "Tanque Norte"
- **THEN** the frontend matches the value to the correct card using `sensorId` and displays "Tanque Norte"
