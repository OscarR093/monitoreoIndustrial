## ADDED Requirements

### Requirement: Settings page displays user profile section
The Settings page SHALL show a profile section where the authenticated user can view and edit their personal information.

#### Scenario: User views their profile
- **WHEN** any authenticated user navigates to /settings
- **THEN** the page SHALL display editable fields for NombreCompleto, Email, and Telefono pre-filled with current values

#### Scenario: User updates their profile
- **WHEN** a user modifies their profile fields and saves
- **THEN** the changes SHALL be persisted via PUT /api/auth/me

#### Scenario: User changes their password
- **WHEN** a user enters current password, new password, and confirmation
- **THEN** the password SHALL be updated if current password matches and validation passes

### Requirement: Settings page displays alarm channel configuration for admins
The Settings page SHALL show an alarm channels section visible only to Admin and SuperAdmin users.

#### Scenario: Admin sees alarm channel section
- **WHEN** an Admin or SuperAdmin navigates to /settings
- **THEN** the page SHALL display a section for configuring Telegram and Email alarm channels

#### Scenario: Viewer does not see alarm channel section
- **WHEN** a Viewer navigates to /settings
- **THEN** the alarm channel configuration section SHALL NOT be rendered

### Requirement: Telegram channel configuration form
The alarm channel section SHALL provide a form for Telegram configuration with bot token, chat ID, and an active toggle.

#### Scenario: Admin configures Telegram channel
- **WHEN** an Admin fills in bot token and chat ID and saves
- **THEN** the Telegram channel SHALL be created or updated and the toggle SHALL appear

#### Scenario: Admin deactivates Telegram channel
- **WHEN** an Admin toggles the Telegram channel from active to inactive
- **THEN** future alarms SHALL NOT be sent via Telegram

### Requirement: Email channel configuration form
The alarm channel section SHALL provide a form for Email (SMTP) configuration with host, port, username, password, from email, to email, and an active toggle.

#### Scenario: Admin configures Email channel
- **WHEN** an Admin fills in SMTP host, port, credentials, and email addresses and saves
- **THEN** the Email channel SHALL be created or updated and the toggle SHALL appear

#### Scenario: Password field is masked
- **WHEN** the Email configuration form is displayed
- **THEN** the SMTP password field SHALL be displayed as a masked input (type=password)
