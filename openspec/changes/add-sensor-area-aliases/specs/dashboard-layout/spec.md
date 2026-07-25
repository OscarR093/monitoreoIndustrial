## ADDED Requirements

### Requirement: Location selector displays area aliases
The location selector panel SHALL display area aliases when available.

#### Scenario: Area dropdown shows alias
- **WHEN** an area has `alias: "Área de Moldeo"`
- **THEN** the area dropdown option shows "Área de Moldeo" instead of "a1"

#### Scenario: Area dropdown falls back to code
- **WHEN** an area has no alias
- **THEN** the area dropdown option shows the technical `codigo`
