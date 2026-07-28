## ADDED Requirements

### Requirement: User management table displays masked fields
The UserManagement page SHALL display email and telefono as masked when the current user is Admin. SuperAdmin SHALL see unmasked values.

#### Scenario: Admin views user table
- **WHEN** an Admin navigates to `/users`
- **THEN** email and telefono columns display masked values as received from the API
- **AND** a "Mostrar" button is visible next to each masked field

#### Scenario: SuperAdmin views user table
- **WHEN** a SuperAdmin navigates to `/users`
- **THEN** email and telefono columns display plain text values as received from the API
- **AND** no "Mostrar" button is shown

#### Scenario: Admin toggles field visibility
- **WHEN** an Admin clicks "Mostrar" next to a masked email
- **THEN** the frontend calls the reveal endpoint and displays the returned plain text value
- **AND** the button changes to "Ocultar"
- **WHEN** the Admin clicks "Ocultar"
- **THEN** the field returns to its masked display

### Requirement: Own profile always shows real data
The Settings page SHALL always display email and telefono in plain text for the authenticated user's own profile.

#### Scenario: User edits own profile
- **WHEN** any authenticated user navigates to Settings → Cuenta
- **THEN** the email and telefono input fields contain the real plain text values
- **AND** no masking or toggle is present
