## 1. Fase 1: Core del Sistema (COMPLETADA)

- [x] 1.1 Bridge Python con simulación de PLC
- [x] 1.2 EMQX + PostgreSQL en Docker
- [x] 1.3 API .NET con REST endpoints (plantas, áreas, sensores, datos)
- [x] 1.4 MqttSubscriberService (suscripción y guardado en DB)
- [x] 1.5 WebSocketRealtimeService (START/STOP + forward a clientes)
- [x] 1.6 Frontend demo (visualización básica)

## 2. Fase 2: Auth API Core

- [x] 2.1 Agregar NuGet packages: `Microsoft.AspNetCore.Authentication.JwtBearer`, `BCrypt.Net-Next`
- [x] 2.2 Crear `Models/Usuario.cs` (Id, Username, PasswordHash, Rol, NombreCompleto, Email, Telefono, DebeCambiarInfo, CreadoPorId)
- [x] 2.3 Agregar `DbSet<Usuario>` en `AppDbContext`, índices únicos, migración
- [x] 2.4 Crear `Services/JwtService.cs` (generar JWT con claims: userId, username, rol, mustUpdateProfile)
- [x] 2.5 `POST /api/auth/login` — validar credenciales, Set-Cookie JWT httpOnly
- [x] 2.6 `POST /api/auth/logout` — limpiar cookie JWT
- [x] 2.7 Configurar `AddAuthentication(JwtBearer)` + `AddAuthorization` con políticas de rol en `Program.cs`
- [x] 2.8 Agregar `[Authorize]` a controladores existentes (Plantas, Areas, Sensores, Datos, TiposGrafico, Unidades)
- [x] 2.9 `[Authorize(Policy = "AdminOrSuperAdmin")]` en POST/PUT/DELETE de SensoresController
- [x] 2.10 Agregar `[Authorize]` a WebSocketController + validación implícita por middleware
- [x] 2.11 Seed de SuperAdmin desde `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD` al iniciar API
- [x] 2.12 CORS condicional: cloud → solo `DOMAIN_URL`, intranet → `SetIsOriginAllowed(_ => true) + AllowCredentials()` (AllowAnyOrigin incompatible con credentials:'include')

## 3. Fase 3: Gestión de Usuarios

- [x] 3.1 `POST /api/auth/register` — crear usuario con validación de rol jerárquico
- [x] 3.2 `PUT /api/auth/complete-profile` — completar nombre, email, teléfono, nueva contraseña en primer login
- [x] 3.3 Middleware `ProfileCompletionMiddleware` que bloquea acceso si `DebeCambiarInfo=true`
- [x] 3.4 `GET /api/auth/me` — ver perfil propio
- [x] 3.5 `PUT /api/auth/me` — editar perfil propio (bloquear cambio de rol)
- [x] 3.6 `DELETE /api/auth/me` — auto-eliminarse (bloquear SuperAdmin)
- [x] 3.7 `GET /api/auth/users` — listar usuarios (Admin solo ve sus viewers)
- [x] 3.8 `DELETE /api/auth/users/{id}` — eliminar con validación jerárquica

## 4. Fase 4: MQTT Seguro

- [x] 4.1 Configurar `EMQX_AUTH__USER__*` en docker-compose (credenciales MQTT)
- [x] 4.2 Agregar `MQTT_USER`, `MQTT_PASS`, `MQTT_USE_TLS` a `bridge/config.py`
- [x] 4.3 Modificar `bridge/mqtt_client.py`: `username_pw_set()` + `tls_set()` condicional
- [x] 4.4 Actualizar `bridge/main.py` y `bridge/control_client.py` con nuevos parámetros
- [x] 4.5 Actualizar `bridge/.env` con variables MQTT auth y TLS
- [x] 4.6 Modificar `MqttSubscriberService.cs`: `WithCredentials()` + `WithTlsOptions()` condicional
- [x] 4.7 Modificar `WebSocketRealtimeService.cs`: `WithCredentials()` + `WithTlsOptions()` condicional

## 5. Fase 5: Docker + Traefik

- [ ] 5.1 Refactorizar `docker-compose.yml` base sin Traefik (EMQX, PostgreSQL, API, Frontend)
- [ ] 5.2 Crear `docker-compose.cloud.yml` con servicio Traefik y labels de routing
- [ ] 5.3 Configurar Traefik: entrypoints web (:80), websecure (:443), mqtts (:8883)
- [ ] 5.4 Let's Encrypt HTTP challenge resolver
- [ ] 5.5 TCP router EMQX con `HostSNI(DOMAIN_URL)`
- [ ] 5.6 HTTP routers API y Frontend con `Host(DOMAIN_URL)`
- [ ] 5.7 Dockerfile para API (build + runtime)
- [ ] 5.8 Dockerfile para Frontend (build de producción con Vite)

## 6. Fase 6: Diseño Frontend

- [x] 6.1 Definir estructura de componentes (páginas, layouts, shared)
- [x] 6.2 Definir rutas protegidas (login, complete-profile, dashboard, admin/users)
- [x] 6.3 Definir estados de la UI: loading, error, empty, success por cada vista
- [x] 6.4 Definir jerarquía de layouts: PublicLayout (login), AuthLayout (sidebar + contenido)
- [x] 6.5 Elegir librerías: React Router, Recharts, Tailwind CSS, Vite
- [x] 6.6 Diseñar estructura de carpetas: `pages/`, `components/`, `context/`, `services/`, `layouts/`
- [x] 6.7 Dashboard: sidebar con plantas/áreas, panel con grid de tarjetas de sensores en tiempo real
- [x] 6.8 Login: centrado, minimal, logo + formulario con estados loading/error
- [x] 6.9 Completar perfil: formulario single page (nombre, email, teléfono, nueva contraseña)
- [x] 6.10 Gestión de usuarios: tabla con crear/eliminar, filtrado por rol

## 7. Fase 7: Frontend Auth

- [x] 7.1 Configurar variables de entorno Vite: `VITE_API_BASE` (derivar API y WS URLs)
- [x] 7.2 `Login.jsx` — formulario usuario/contraseña con estado loading/error
- [x] 7.3 `CompleteProfile.jsx` — formulario primer login (nombre, email, teléfono, nueva contraseña)
- [x] 7.4 `AuthContext.jsx` — estado auth, login, logout, verificar sesión, rol del usuario
- [x] 7.5 `api.js` — wrapper de fetch con `credentials: 'include'` y manejo de 401/403
- [x] 7.6 Router con rutas protegidas (`ProtectedRoute` redirige a login si no auth)
- [x] 7.7 Reemplazar URLs hardcodeadas en `App.jsx` por variables de entorno
- [x] 7.8 Redirección: `mustUpdateProfile` → CompleteProfile, no auth → Login
- [x] 7.9 Botón de logout en el layout autenticado

## 8. Fase 8: Verificación Integral

- [x] 8.1 Viewer no puede crear/editar/eliminar sensores (403)
- [x] 8.2 Admin no puede crear Admins ni eliminar Admins (403)
- [x] 8.3 SuperAdmin no puede auto-eliminarse (403)
- [x] 8.4 Nadie puede editar perfil ajeno (403)
- [ ] 8.5 WebSocket acepta conexión con JWT válido (101 upgrade)
- [ ] 8.6 WebSocket rechaza conexión sin JWT (401)
- [ ] 8.7 Bridge MQTTS con credenciales válidas publica datos (modo cloud)
- [ ] 8.8 Bridge MQTT plain publica datos (modo intranet)
- [ ] 8.9 `docker compose up` (intranet) levanta todos los servicios sin TLS
- [ ] 8.10 `docker compose -f docker-compose.yml -f docker-compose.cloud.yml up` (cloud) levanta Traefik + TLS
