## ADDED Requirements

### Requirement: EMQX MQTT credential authentication
The system SHALL configure EMQX to require username and password authentication for MQTT connections.

#### Scenario: Bridge connects with valid MQTT credentials
- **WHEN** the bridge sends an MQTT CONNECT packet with `MQTT_USER` and `MQTT_PASS` from environment variables
- **THEN** EMQX accepts the connection and the bridge can publish and subscribe

#### Scenario: Unauthenticated MQTT connection rejected in cloud mode
- **WHEN** `DEPLOYMENT_MODE=cloud` and a client attempts to connect to EMQX without valid credentials
- **THEN** EMQX rejects the connection
- **NOTE**: EMQX 5.x no soporta `EMQX_ALLOW_ANONYMOUS=false` vía env var. La restricción de conexiones anónimas requiere configuración del dashboard de EMQX (Authentication → Built-in Database → Disable Anonymous). Las credenciales vía `EMQX_AUTH__USER__*` se configuraron correctamente.

#### Scenario: Anonymous MQTT allowed in intranet mode
- **WHEN** `DEPLOYMENT_MODE=intranet`
- **THEN** EMQX allows anonymous connections on port 1883

### Requirement: MQTT credentials from environment variables
The system SHALL read MQTT credentials from `MQTT_USER` and `MQTT_PASS` environment variables for both bridge and API.

#### Scenario: Bridge reads MQTT credentials from .env
- **WHEN** the bridge starts
- **THEN** `config.py` loads `MQTT_USER` and `MQTT_PASS` from environment variables

#### Scenario: API reads MQTT credentials from .env
- **WHEN** `MqttSubscriberService` and `WebSocketRealtimeService` initialize
- **THEN** both services load `MQTT_USER` and `MQTT_PASS` from environment variables

### Requirement: Bridge MQTT client with TLS support
The bridge SHALL support TLS connections when `MQTT_USE_TLS=true` and use CA system trust store.

#### Scenario: Bridge connects with TLS in cloud mode
- **WHEN** `MQTT_USE_TLS=true` and the bridge connects to MQTTS port
- **THEN** `paho-mqtt` client calls `tls_set()` using system CA certificates before connecting

#### Scenario: Bridge connects without TLS in intranet mode
- **WHEN** `MQTT_USE_TLS=false` and the bridge connects to MQTT port
- **THEN** `paho-mqtt` client connects without TLS configuration

### Requirement: API MQTT client with optional TLS
The system SHALL configure MQTTnet clients in the API to optionally use TLS based on `MQTT_USE_TLS` environment variable.

#### Scenario: API MQTT client with TLS
- **WHEN** `MQTT_USE_TLS=true`
- **THEN** `MqttSubscriberService` and `WebSocketRealtimeService` configure `WithTls()` on the MQTT client options

#### Scenario: API MQTT client without TLS
- **WHEN** `MQTT_USE_TLS=false`
- **THEN** `MqttSubscriberService` and `WebSocketRealtimeService` connect with `WithTcpServer()` only
