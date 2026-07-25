## ADDED Requirements

### Requirement: lucide-react icons replace all emoji usage
The frontend SHALL use `lucide-react` icons exclusively, removing all emoji characters from UI components.

#### Scenario: Sidebar navigation uses icons
- **WHEN** the sidebar is rendered
- **THEN** `LayoutDashboard` replaces 📊, `Users` replaces 👥, `UserCircle` replaces 👤, `LogOut` replaces 🚪

#### Scenario: Status indicators use icons
- **WHEN** connection status is displayed
- **THEN** `Plug` replaces 🔌 (connected), `PlugZap` replaces ⚡ (reconnecting), `WifiOff` replaces 🔴 (disconnected)

#### Scenario: Sensor-related icons
- **WHEN** sensor cards are rendered
- **THEN** `Thermometer` is used for temperature, `Gauge` for pressure, `Zap` for voltage, `Activity` for generic readings

#### Scenario: Alert icons
- **WHEN** alerts are displayed
- **THEN** `AlertTriangle` replaces ⚠️, `AlertCircle` replaces 🔴

### Requirement: Icon mapping is centralized
All icon mappings SHALL be defined in a single shared module for consistency.

#### Scenario: Single icon config file
- **WHEN** a component needs an icon
- **THEN** the icon is imported from a shared `icons.js` config that maps semantic names to lucide components

#### Scenario: Consistent icon sizing
- **WHEN** icons are rendered across components
- **THEN** all icons of the same semantic role (navigation, status, sensor) share the same dimensions (default: 20px for nav, 16px for inline, 24px for headers)
