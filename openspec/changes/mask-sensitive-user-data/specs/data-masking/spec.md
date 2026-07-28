## ADDED Requirements

### Requirement: API masks email in user list responses
The API SHALL mask email addresses when returning user data via `GET /api/auth/users` for Admin role. SuperAdmin and the profile owner SHALL receive unmasked values.

#### Scenario: Admin requests user list
- **WHEN** an Admin calls `GET /api/auth/users`
- **THEN** each user's email is returned masked (e.g., `j***@e****.com`)
- **AND** each user's telefono is returned masked (e.g., `+52 *** 7890`)

#### Scenario: SuperAdmin requests user list
- **WHEN** a SuperAdmin calls `GET /api/auth/users`
- **THEN** each user's email and telefono are returned in plain text

#### Scenario: User requests own profile
- **WHEN** any authenticated user calls `GET /api/auth/me`
- **THEN** the response contains the user's own email and telefono in plain text

#### Scenario: Short email masking
- **WHEN** an email has a local part of 2 or fewer characters (e.g., `a@b.co`)
- **THEN** the masked value SHALL be `***@b**.co` (fully masked local part)

#### Scenario: No data to mask
- **WHEN** a user has null or empty email
- **THEN** the response returns null or empty string without modification

### Requirement: API provides field reveal endpoint
The API SHALL provide an endpoint `GET /api/auth/users/{id}/reveal?field={email|telefono}` that returns the unmasked value of a single field for authenticated Admin+ users.

#### Scenario: Admin reveals a field
- **WHEN** an Admin calls `GET /api/auth/users/5/reveal?field=email`
- **THEN** the response is `{ "value": "juan@empresa.com" }` with status 200

#### Scenario: Viewer attempts reveal
- **WHEN** a Viewer calls the reveal endpoint
- **THEN** the response is 403 Forbidden

#### Scenario: Invalid field name
- **WHEN** any user calls `GET /api/auth/users/5/reveal?field=password`
- **THEN** the response is 400 Bad Request

#### Scenario: Non-existent user
- **WHEN** any user calls `GET /api/auth/users/999/reveal?field=email`
- **THEN** the response is 404 Not Found
