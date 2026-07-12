## ADDED Requirements

### Requirement: JWT httpOnly cookie authentication
The system SHALL authenticate users via JWT stored in an httpOnly, Secure, SameSite cookie.

#### Scenario: Successful login
- **WHEN** a user submits valid credentials to `POST /api/auth/login`
- **THEN** the system returns 200 with a `Set-Cookie` header containing a JWT and the user's profile data in the response body

#### Scenario: Failed login
- **WHEN** a user submits invalid credentials to `POST /api/auth/login`
- **THEN** the system returns 401 with an error message

#### Scenario: Authenticated request passes JWT cookie
- **WHEN** an authenticated user makes any request to a protected endpoint with a valid JWT cookie
- **THEN** the JWT middleware validates the token and sets `HttpContext.User` with the user's claims

#### Scenario: Unauthenticated request is rejected
- **WHEN** a request is made to a protected endpoint without a valid JWT cookie
- **THEN** the system returns 401

### Requirement: JWT cookie security properties
The JWT cookie SHALL be set with `HttpOnly=true`, `Secure=true` (in production), and `SameSite=Strict`.

#### Scenario: Cookie is not accessible from JavaScript
- **WHEN** the JWT cookie is set with `HttpOnly=true`
- **THEN** JavaScript in the browser cannot read the cookie via `document.cookie`

#### Scenario: Cookie is only sent over HTTPS in cloud mode
- **WHEN** `DEPLOYMENT_MODE=cloud` and the JWT cookie is set with `Secure=true`
- **THEN** the cookie is only transmitted over HTTPS connections

### Requirement: Logout endpoint
The system SHALL provide a logout endpoint that clears the JWT cookie.

#### Scenario: User logs out
- **WHEN** an authenticated user sends `POST /api/auth/logout`
- **THEN** the system returns 200 and sets the JWT cookie with an empty value and immediate expiration

### Requirement: User registration by admin
The system SHALL allow SuperAdmin and Admin users to create new user accounts with a temporary password.

#### Scenario: SuperAdmin creates an Admin account
- **WHEN** a SuperAdmin sends `POST /api/auth/register` with `{ username, tempPassword, rol: "admin" }`
- **THEN** the system creates the user with `DebeCambiarInfo=true` and returns 201

#### Scenario: Admin creates a Viewer account
- **WHEN** an Admin sends `POST /api/auth/register` with `{ username, tempPassword, rol: "viewer" }`
- **THEN** the system creates the user with `DebeCambiarInfo=true` and returns 201

#### Scenario: Admin cannot create another Admin
- **WHEN** an Admin attempts to create a user with `rol: "admin"`
- **THEN** the system returns 403

#### Scenario: Viewer cannot create any user
- **WHEN** a Viewer sends `POST /api/auth/register`
- **THEN** the system returns 403

### Requirement: First login profile completion
The system SHALL require users to complete their profile (full name, email, phone, new password) on their first login.

#### Scenario: First login redirects to profile completion
- **WHEN** a user with `DebeCambiarInfo=true` logs in successfully
- **THEN** the JWT includes claim `mustUpdateProfile: true` and the profile completion endpoint is the only accessible endpoint

#### Scenario: Blocked access before profile completion
- **WHEN** a user with `DebeCambiarInfo=true` and valid JWT attempts to access any endpoint other than `/api/auth/complete-profile`
- **THEN** the system returns 403 with message indicating profile completion is required

#### Scenario: Successful profile completion
- **WHEN** a user with `DebeCambiarInfo=true` sends `PUT /api/auth/complete-profile` with `{ nombreCompleto, email, telefono, nuevaPassword }`
- **THEN** the system updates the user profile, sets `DebeCambiarInfo=false`, and returns 200

### Requirement: Self profile management
The system SHALL allow any authenticated user to view and edit their own profile.

#### Scenario: View own profile
- **WHEN** an authenticated user sends `GET /api/auth/me`
- **THEN** the system returns the user's profile data (excluding password hash)

#### Scenario: Edit own profile
- **WHEN** an authenticated user sends `PUT /api/auth/me` with updated fields
- **THEN** the system updates the user's profile and returns 200

### Requirement: No editing of other profiles
The system SHALL NOT allow any user, including SuperAdmin, to edit another user's profile.

#### Scenario: SuperAdmin attempts to edit another user's profile
- **WHEN** a SuperAdmin sends `PUT /api/auth/users/{id}`
- **THEN** the system returns 403

### Requirement: Self-deletion with restrictions
The system SHALL allow Admin and Viewer users to delete their own account, but SHALL prevent SuperAdmin from self-deleting.

#### Scenario: Admin deletes own account
- **WHEN** an Admin sends `DELETE /api/auth/me`
- **THEN** the system deletes the user account and returns 200

#### Scenario: SuperAdmin cannot delete own account
- **WHEN** a SuperAdmin sends `DELETE /api/auth/me`
- **THEN** the system returns 403

### Requirement: User listing with role filtering
The system SHALL allow SuperAdmin and Admin to list users, filtered by their creation permissions.

#### Scenario: SuperAdmin lists all users
- **WHEN** a SuperAdmin sends `GET /api/auth/users`
- **THEN** the system returns all users (superadmins, admins, viewers)

#### Scenario: Admin lists only viewers
- **WHEN** an Admin sends `GET /api/auth/users`
- **THEN** the system returns only viewers created by that Admin

### Requirement: User deletion by admin
The system SHALL allow SuperAdmin to delete any user except themselves, and Admin to delete only Viewers.

#### Scenario: SuperAdmin deletes an Admin
- **WHEN** a SuperAdmin sends `DELETE /api/auth/users/{adminId}`
- **THEN** the system deletes the Admin and returns 200

#### Scenario: Admin deletes a Viewer they created
- **WHEN** an Admin sends `DELETE /api/auth/users/{viewerId}` where the viewer was created by this Admin
- **THEN** the system deletes the Viewer and returns 200

#### Scenario: Admin cannot delete another Admin
- **WHEN** an Admin attempts to delete another Admin
- **THEN** the system returns 403

### Requirement: SuperAdmin seed on first run
The system SHALL automatically create a SuperAdmin user from environment variables if no SuperAdmin exists in the database.

#### Scenario: First API startup with no users
- **WHEN** the API starts and no user with `rol: "superadmin"` exists
- **THEN** the system creates a SuperAdmin using `SUPER_ADMIN_USERNAME` and `SUPER_ADMIN_PASSWORD` from environment variables

#### Scenario: Subsequent API startups skip seed
- **WHEN** the API starts and a SuperAdmin already exists
- **THEN** the system does not create or modify any user
