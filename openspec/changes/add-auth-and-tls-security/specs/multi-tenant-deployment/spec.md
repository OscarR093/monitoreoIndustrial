## ADDED Requirements

### Requirement: Per-client deployment via docker-compose
The system SHALL support per-client isolated deployments using a single docker-compose stack with environment variable configuration.

#### Scenario: Deploy a new client in cloud mode
- **WHEN** an operator copies the template, sets `DOMAIN_URL=cliente.dominio.com` and `DEPLOYMENT_MODE=cloud` in `.env`
- **THEN** `docker compose -f docker-compose.yml -f docker-compose.cloud.yml up -d` deploys the full stack with TLS

#### Scenario: Deploy a new client in intranet mode
- **WHEN** an operator sets `DEPLOYMENT_MODE=intranet` in `.env`
- **THEN** `docker compose up -d` deploys the stack without Traefik or TLS

### Requirement: Docker Compose file structure
The system SHALL provide a base `docker-compose.yml` with core services (EMQX, API, PostgreSQL, Frontend) and a `docker-compose.cloud.yml` override that adds Traefik with TLS routing.

#### Scenario: Base compose contains core services
- **WHEN** `docker-compose.yml` is inspected
- **THEN** it defines EMQX, PostgreSQL, API, and Frontend services without Traefik

#### Scenario: Cloud override adds Traefik
- **WHEN** `docker-compose.cloud.yml` is inspected
- **THEN** it defines a Traefik service and adds routing labels to EMQX, API, and Frontend services

### Requirement: Environment variable configuration
The system SHALL accept all deployment configuration through a single `.env` file per client.

#### Scenario: Required environment variables for cloud mode
- **WHEN** `DEPLOYMENT_MODE=cloud`
- **THEN** the `.env` file MUST contain `DOMAIN_URL`, `LETSENCRYPT_EMAIL`, `MQTT_USER`, `MQTT_PASS`, `SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_PASSWORD`, `JWT_SECRET`

#### Scenario: Required environment variables for intranet mode
- **WHEN** `DEPLOYMENT_MODE=intranet`
- **THEN** the `.env` file MUST contain `SUPER_ADMIN_USERNAME`, `SUPER_ADMIN_PASSWORD`, `JWT_SECRET`, and MAY omit TLS-related variables

### Requirement: Traefik per-client routing
Each client deployment SHALL use Traefik with `Host` and `HostSNI` rules matching the client's unique `DOMAIN_URL`.

#### Scenario: Separate Traefik instance per client
- **WHEN** two clients are deployed on the same Docker host
- **THEN** each client has its own Traefik instance listening on different ports, routing by `DOMAIN_URL`

#### Scenario: Traefik routes frontend by host
- **WHEN** a request arrives with `Host: cliente.dominio.com`
- **THEN** Traefik routes to the frontend service of the correct client deployment

### Requirement: Bridge environment variables
The bridge SHALL be configurable via its own `.env` file, independent of the server docker-compose.

#### Scenario: Bridge configuration for cloud mode
- **WHEN** `DEPLOYMENT_MODE=cloud` in the bridge `.env`
- **THEN** the bridge connects to `MQTT_BROKER=<DOMAIN_URL>` on port `MQTT_PORT=8883` with `MQTT_USE_TLS=true`

#### Scenario: Bridge configuration for intranet mode
- **WHEN** `DEPLOYMENT_MODE=intranet` in the bridge `.env`
- **THEN** the bridge connects to `MQTT_BROKER=<server_ip>` on port `MQTT_PORT=1883` with `MQTT_USE_TLS=false`
