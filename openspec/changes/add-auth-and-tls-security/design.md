## Context

El sistema de monitoreo industrial actual tiene un frontend demo, una API .NET 10, un bridge Python, EMQX como broker MQTT y PostgreSQL. Todos los canales de comunicación están sin cifrar y sin autenticación:

- REST API expuesta en HTTP plano, CORS `AllowAnyOrigin`
- WebSocket sin validación de identidad
- MQTT sin TLS ni credenciales
- Frontend con URLs hardcodeadas a `localhost`

El proyecto se despliega por cliente (modelo single-tenant) y opera en dos modos: cloud (bridge remoto + servidor cloud con Traefik) e intranet (todo en LAN del cliente). El usuario tiene experiencia previa con Traefik + Let's Encrypt en el proyecto monitoreotermico.

## Goals / Non-Goals

**Goals:**
- Encriptar todo el tráfico externo (Bridge→EMQX, Navegador→Servidor) con TLS vía Traefik + Let's Encrypt
- Autenticar usuarios del frontend con JWT httpOnly cookie
- Implementar 3 roles jerárquicos: SuperAdmin, Admin, Viewer
- Autenticar bridge y API en EMQX con credenciales MQTT
- Soportar modo cloud (TLS activo) e intranet (sin TLS) vía `DEPLOYMENT_MODE`
- Flujo de primer inicio de sesión con completar perfil obligatorio
- Proteger perfiles: nadie edita perfiles ajenos, SuperAdmin no se auto-elimina

**Non-Goals:**
- Dashboard personalizado (agrupación de sensores, cambio de gráficos) — esto es futuro
- mTLS (mutual TLS) para MQTT — server-side TLS es suficiente
- OAuth2 / SSO / proveedores externos
- Rate limiting o protección DDoS
- Recuperación de contraseña
- Auditoría de acciones de usuario
- API keys para integraciones externas

## Decisions

### D1: Traefik como terminador TLS único

**Decisión**: Traefik termina TLS para HTTPS (:443), WSS (:443) y MQTTS (:8883) usando un solo certificado Let's Encrypt.

**Alternativa considerada**: EMQX con su propio TLS independiente. Rechazada porque requiere gestionar dos fuentes de certificados (Traefik para web, EMQX para MQTT) y el patrón ya fue validado en monitoreotermico.

**Rationale**: Un solo punto de terminación TLS simplifica la renovación de certificados, reduce la superficie de configuración y reutiliza el `acme.json` existente. Traefik actúa como proxy TCP para MQTT usando `HostSNI` routing.

### D2: JWT en httpOnly cookie (no en header Authorization)

**Decisión**: JWT almacenado en cookie httpOnly, no en localStorage ni en header Authorization.

**Alternativa considerada**: Bearer token en header `Authorization`. Rechazada porque:
- Requiere manejo manual en frontend (storage, refresh, attach a cada request)
- Expone el token a XSS (localStorage es accesible desde JS)
- WebSocket no puede enviar headers custom, requeriría pasar token por query string

**Rationale**: httpOnly cookie es inmune a XSS, se envía automáticamente en cada request y en el handshake WebSocket. El frontend nunca ve el token.

### D3: Roles como string enum en el modelo Usuario

**Decisión**: Campo `Rol` tipo string con valores `"superadmin"`, `"admin"`, `"viewer"` en una sola tabla `Usuarios`.

**Alternativa considerada**: Tablas separadas de roles y permisos con relación many-to-many. Rechazada como sobre-ingeniería para 3 roles fijos.

**Rationale**: Con 3 roles y <5 clientes, una tabla plana es más simple de consultar, migrar y mantener. Si en el futuro los permisos se vuelven granulares, se puede migrar a un modelo RBAC sin cambiar la API pública.

### D4: Credenciales MQTT compartidas bridge + API

**Decisión**: Un solo par `MQTT_USER`/`MQTT_PASS` usado por bridge y API para conectarse a EMQX.

**Alternativa considerada**: Credenciales separadas con ACLs de EMQX (bridge solo publica, API solo se suscribe). Rechazada para MVP porque añade complejidad de configuración sin beneficio inmediato de seguridad (ambos componentes son parte del mismo despliegue confiable).

**Rationale**: Si se necesita revocar acceso granular en el futuro, se migra a credenciales separadas con ACLs.

### D5: Docker Compose con override para modo cloud

**Decisión**: `docker-compose.yml` base (EMQX, API, DB, Frontend) + `docker-compose.cloud.yml` override (agrega Traefik + labels de routing).

**Alternativa considerada**: Scripts de generación de docker-compose por cliente. Rechazada: más código a mantener. El override es nativo de Docker Compose.

**Rationale**: Mismo artefacto para ambos modos. Intranet: `docker compose up -d`. Cloud: `docker compose -f docker-compose.yml -f docker-compose.cloud.yml up -d`.

### D6: Seed de SuperAdmin desde variables de entorno

**Decisión**: Al iniciar la API, si no existe ningún SuperAdmin, se crea uno con credenciales de `SUPER_ADMIN_USERNAME` y `SUPER_ADMIN_PASSWORD` del .env.

**Alternativa considerada**: Migration con seed data. Rechazada: las credenciales quedarían hardcodeadas en el código de migración, lo cual es inseguro.

**Rationale**: Mismo patrón validado en monitoreotermico. El .env por cliente contiene sus credenciales únicas.

### D7: Modo de prueba `INTEGRATION_TEST` para tests xUnit

**Decisión**: `Program.cs` soporta `INTEGRATION_TEST=true` para usar InMemory Database en lugar de PostgreSQL durante pruebas automatizadas. Los servicios MQTT se omiten en modo test.

**Rationale**: `WebApplicationFactory` requiere una base de datos que no dependa de infraestructura externa. InMemory DB permite tests rápidos (~7s para 42 tests) sin Docker ni PostgreSQL. El MQTT y WebSocket se deshabilitan automáticamente en modo test para evitar errores de conexión.

## Risks / Trade-offs

- **[Riesgo] Cookie httpOnly + SameSite=Strict puede romper en desarrollo local** (frontend en :5173, API en :5000). → Mitigación: en desarrollo usar `SameSite=None; Secure=false` o proxy de Vite.

- **[Riesgo] Si el JWT expira durante una sesión WebSocket**, la conexión se mantiene abierta sin revalidación. → Mitigación: WebSocket envía ping/pong periódico; el servidor puede cerrar la conexión al expirar el JWT y el frontend reconecta.

- **[Riesgo] Traefik TCP router para MQTT requiere HostSNI** → el bridge debe conectarse usando el dominio (no IP) y con TLS. La variable `MQTT_BROKER` debe ser un dominio resoluble. En intranet, el bridge usa IP y sin TLS.

- **[Trade-off] Sin recuperación de contraseña en MVP** → si un usuario pierde su contraseña, un Admin debe crearle una nueva cuenta. Aceptable para <5 clientes con soporte directo.

- **[Trade-off] `EMQX_ALLOW_ANONYMOUS` no funciona en EMQX 5.x vía env var** → Las credenciales MQTT se configuran correctamente (`EMQX_AUTH__USER__*`), pero las conexiones anónimas no se bloquean por esta vía. Para rechazar anónimos se requiere configuración manual en el dashboard de EMQX (Authentication → Disable Anonymous). En intranet esto no es un problema de seguridad.

## Open Questions

- ¿El dashboard personalizado (agrupar sensores, cambiar gráficos) requiere su propio endpoint de configuración o se maneja en frontend con localStorage?
- ¿Las alertas por teléfono (SMS/Telegram) se implementan en este cambio o en uno futuro?
