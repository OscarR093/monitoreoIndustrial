## ADDED Requirements

### Requirement: Traefik TLS termination for HTTPS and WSS
The system SHALL use Traefik as the TLS termination point for all HTTP and WebSocket traffic on port 443 using a Let's Encrypt certificate.

#### Scenario: Browser connects via HTTPS in cloud mode
- **WHEN** `DEPLOYMENT_MODE=cloud` and a browser navigates to `https://<DOMAIN_URL>`
- **THEN** Traefik serves the frontend and API over HTTPS with a valid Let's Encrypt certificate

#### Scenario: Browser connects via WSS in cloud mode
- **WHEN** `DEPLOYMENT_MODE=cloud` and the frontend opens a WebSocket connection to `wss://<DOMAIN_URL>/ws/realtime`
- **THEN** Traefik proxies the encrypted WebSocket connection to the API service

### Requirement: Traefik TCP router for MQTTS
The system SHALL use Traefik as a TCP proxy for MQTT traffic on port 8883, terminating TLS with the same Let's Encrypt certificate.

#### Scenario: Bridge connects via MQTTS in cloud mode
- **WHEN** `DEPLOYMENT_MODE=cloud` and the bridge connects to `mqtts://<DOMAIN_URL>:8883`
- **THEN** Traefik terminates TLS and forwards plain MQTT to EMQX on port 1883

#### Scenario: MQTT TLS SNI matching
- **WHEN** a TLS handshake arrives on port 8883 with SNI matching `DOMAIN_URL`
- **THEN** Traefik routes the connection to the EMQX service

### Requirement: HTTP to HTTPS redirect
The system SHALL redirect all HTTP traffic on port 80 to HTTPS on port 443 in cloud mode.

#### Scenario: HTTP request in cloud mode
- **WHEN** `DEPLOYMENT_MODE=cloud` and a browser navigates to `http://<DOMAIN_URL>`
- **THEN** Traefik redirects to `https://<DOMAIN_URL>` with a 301 response

### Requirement: TLS bypass in intranet mode
The system SHALL NOT enable TLS when `DEPLOYMENT_MODE=intranet`.

#### Scenario: Intranet mode omits Traefik
- **WHEN** `DEPLOYMENT_MODE=intranet`
- **THEN** Traefik is not deployed, services are accessed directly via HTTP and plain MQTT

#### Scenario: Intranet mode exposes plain MQTT
- **WHEN** `DEPLOYMENT_MODE=intranet`
- **THEN** EMQX listens on port 1883 for plain MQTT connections from bridge and API
