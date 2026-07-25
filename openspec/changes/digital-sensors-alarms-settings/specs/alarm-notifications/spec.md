## ADDED Requirements

### Requirement: Admin can configure notification channels
Admin and SuperAdmin users SHALL be able to create, read, update, and delete alarm notification channel configurations via the API.

#### Scenario: Admin creates a Telegram channel
- **WHEN** an Admin sends POST /api/configuracion-alarma with Tipo="telegram" and valid ConfigJson
- **THEN** the channel configuration is persisted with Activo=false by default

#### Scenario: Admin activates a channel
- **WHEN** an Admin sends PUT to toggle Activo=true on an existing channel
- **THEN** the channel SHALL be used for future alarm notifications

#### Scenario: Viewer cannot access channel configuration
- **WHEN** a Viewer attempts any operation on /api/configuracion-alarma
- **THEN** the system SHALL return 403 Forbidden

### Requirement: Telegram notifications use Bot API
When a Telegram channel is active, the AlarmService SHALL send notifications via the Telegram Bot API using the configured bot token and chat ID.

#### Scenario: Alarm triggers Telegram notification
- **WHEN** an alarm fires and the Telegram channel is active
- **THEN** the AlarmService SHALL POST to https://api.telegram.org/bot{token}/sendMessage with the chat ID and an alarm message containing sensor name, value, and timestamp

#### Scenario: Telegram API unreachable
- **WHEN** the Telegram API returns an error or times out (5 second timeout)
- **THEN** the AlarmService SHALL log the error and continue without blocking other channels

### Requirement: Email notifications use SMTP
When an Email channel is active, the AlarmService SHALL send notifications via SMTP using the configured host, port, and credentials.

#### Scenario: Alarm triggers email notification
- **WHEN** an alarm fires and the Email channel is active
- **THEN** the AlarmService SHALL send an email with alarm details (sensor name, value, timestamp, plant/area) to the configured recipient

#### Scenario: SMTP server unreachable
- **WHEN** the SMTP server returns an error or times out (5 second timeout)
- **THEN** the AlarmService SHALL log the error and continue without blocking other channels

### Requirement: Rate limiting prevents alarm spam
The AlarmService SHALL enforce a configurable cooldown period (default 5 minutes) between consecutive notifications for the same sensor.

#### Scenario: Consecutive out-of-range readings within cooldown
- **WHEN** a sensor value is out of range AND less than 5 minutes have passed since the last notification for that sensor
- **THEN** the AlarmService SHALL NOT send a new notification

#### Scenario: Out-of-range reading after cooldown expires
- **WHEN** a sensor value is out of range AND more than 5 minutes have passed since the last notification
- **THEN** the AlarmService SHALL send a new notification and update the sensor's UltimaAlarmaEnviada timestamp

#### Scenario: Normal-to-warning transition triggers immediately
- **WHEN** a sensor transitions from normal to warning state for the first time
- **THEN** the AlarmService SHALL send a notification immediately (no cooldown applies to first alarm)

### Requirement: Channel configuration JSON is validated by type
The system SHALL validate ConfigJson structure based on the channel Tipo when creating or updating a channel.

#### Scenario: Valid Telegram config accepted
- **WHEN** ConfigJson contains valid `botToken` and `chatId` fields for Tipo="telegram"
- **THEN** the configuration is accepted

#### Scenario: Invalid config rejected
- **WHEN** ConfigJson is missing required fields for the given Tipo
- **THEN** the system SHALL return 400 Bad Request with a descriptive error message
