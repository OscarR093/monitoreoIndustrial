## Why

El sistema actual expone todos los endpoints REST, WebSocket y MQTT sin autenticación, autorización ni cifrado. Cualquier persona que conozca la IP o el dominio puede leer datos industriales, modificar la configuración de sensores y acceder al broker MQTT. Para un producto B2B que se despliega en fábricas o se expone a internet, esto es un bloqueante de negocio.

## What Changes

- **TLS/SSL en todo el tráfico externo**: Traefik como terminador TLS con Let's Encrypt para HTTPS, WSS y MQTTS. Modo cloud vs intranet controlado por `DEPLOYMENT_MODE`.
- **Autenticación JWT con httpOnly cookie**: Login/logout, middleware de validación JWT, cookie segura (httpOnly, Secure, SameSite).
- **Sistema de 3 roles**: SuperAdmin (crea admins, CRUD sensores, gestión de usuarios), Admin (crea viewers, CRUD sensores, gestión de viewers), Viewer (solo ver y personalizar su dashboard).
- **Credenciales MQTT**: Bridge y API se autentican en EMQX con user/password vía variables de entorno.
- **Flujo de primer inicio de sesión**: Usuario creado con contraseña temporal debe completar nombre, email, teléfono y nueva contraseña antes de acceder al sistema.
- **Protección de perfiles**: Nadie puede modificar perfiles ajenos. El SuperAdmin no puede auto-eliminarse.
- **Frontend**: Configuración de URLs vía variables de entorno, página de login, formulario de completar perfil.

## Capabilities

### New Capabilities
- `tls-encryption`: Cifrado TLS para todo tráfico externo (HTTPS, WSS, MQTTS) vía Traefik con Let's Encrypt, modo dual cloud/intranet.
- `user-auth`: Autenticación JWT httpOnly, login/logout, middleware de validación, flujo de primer inicio de sesión.
- `role-based-access`: Sistema de roles SuperAdmin/Admin/Viewer con matriz de permisos jerárquica.
- `mqtt-auth`: Autenticación MQTT con credenciales user/password para bridge y API en EMQX.
- `multi-tenant-deployment`: Plantilla de despliegue por cliente con docker-compose, Traefik por cliente, y variables de entorno parametrizables.

### Modified Capabilities
<!-- Ningún spec existente para modificar -->

## Impact

- **API (.NET)**: Todos los controladores, Program.cs (middleware auth, CORS condicional), nuevos modelos Usuario y endpoints `/api/auth/*`
- **Bridge (Python)**: `mqtt_client.py` (TLS + credenciales MQTT), `config.py` (nuevas env vars)
- **Docker**: `docker-compose.yml` base + `docker-compose.cloud.yml` override con Traefik, generación de certificados
- **Frontend (React)**: Login, completar perfil, URLs dinámicas vía env vars
- **EMQX**: Configuración de credenciales MQTT vía env vars
- **.env**: Nuevas variables (`DEPLOYMENT_MODE`, `JWT_SECRET`, `MQTT_USER`, `MQTT_PASS`, `ADMIN_USER`, `ADMIN_PASS`, etc.)
