# Sistema de Monitoreo Industrial - Documentación de Desarrollo

## Fecha: 2026-07-12

## Arquitectura del Sistema

```
PLC (real o simulado) → Bridge → MQTT Broker (EMQX) → API (.NET) ↔ WebSocket ↔ Frontend
```

### Flujo de Datos

1. **Bridge** lee datos del PLC (real via Modbus TCP o simulado)
2. **Bridge** publica en topics MQTT:
   - `industrial/{planta}/{area}/history` - datos históricos (cada 20 min)
   - `industrial/{planta}/{area}/realtime` - datos en tiempo real (cada 2s, si START)
3. **API** suscrita a topics MQTT recibe datos y guarda en PostgreSQL
4. **WebSocket** detecta cliente conectado → publica "START" en topic control
5. **WebSocket** detecta cliente desconectado → publica "STOP"
6. **Frontend** recibe datos realtime via WebSocket y los visualiza

### Autenticación y Seguridad

- **API → Frontend**: JWT httpOnly cookie con 3 roles (SuperAdmin, Admin, Viewer)
- **MQTT (Bridge + API → EMQX)**: Credenciales user/password vía `MQTT_USER`/`MQTT_PASS`
- **TLS**: Modo cloud con Traefik + Let's Encrypt (HTTPS/WSS/MQTTS). Modo intranet sin TLS.
- **CORS**: Cloud restringido al dominio, intranet con `SetIsOriginAllowed(_ => true)`

---

## Estructura del Proyecto

```
monitoreoIndustrial/
├── docker/
│   └── docker-compose.yml        # EMQX + PostgreSQL
├── api/                          # .NET 10 Web API
│   ├── Models/
│   │   ├── Planta.cs, Area.cs, TipoGrafico.cs, Unidad.cs
│   │   ├── Sensor.cs, DatoSensor.cs
│   │   ├── Usuario.cs            # Auth: roles + perfil
│   │   └── Dtos.cs               # LoginRequest, RegisterRequest, etc.
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Controllers/
│   │   ├── AuthController.cs     # Login, register, complete-profile, users CRUD
│   │   ├── PlantasController.cs, AreasController.cs
│   │   ├── SensoresController.cs, DatosController.cs
│   │   ├── TiposGraficoController.cs, UnidadesController.cs
│   │   └── WebSocketController.cs
│   ├── Services/
│   │   ├── JwtService.cs         # Generación/validación JWT
│   │   ├── MqttSubscriberService.cs  # Suscriptor MQTT (history + realtime)
│   │   └── WebSocketRealtimeService.cs # WebSocket con control START/STOP
│   ├── Middleware/
│   │   └── ProfileCompletionMiddleware.cs # Bloquea acceso si DebeCambiarInfo=true
│   ├── Migrations/
│   └── Program.cs                # Configuración auth, CORS, seed SuperAdmin
├── api.Tests/                    # xUnit tests (42 tests, InMemory DB)
│   ├── CustomWebApplicationFactory.cs
│   ├── JwtServiceTests.cs
│   ├── AuthControllerTests.cs
│   └── AuthorizationTests.cs
├── bridge/                       # Python bridge
│   ├── config.py                 # + MQTT_USER, MQTT_PASS, MQTT_USE_TLS
│   ├── mqtt_client.py            # + TLS + credenciales
│   ├── control_client.py         # + TLS + credenciales
│   └── main.py
├── frontend/                     # React + Vite + Tailwind
│   ├── src/
│   │   ├── services/api.js       # fetch wrapper con withCredentials
│   │   ├── context/AuthContext.jsx
│   │   ├── components/ProtectedRoute.jsx
│   │   ├── layouts/PublicLayout.jsx, AuthLayout.jsx
│   │   └── pages/Login.jsx, CompleteProfile.jsx, Dashboard.jsx, UserManagement.jsx
│   └── package.json
├── .env, .env.example
├── AGENTS.md
└── openspec/                     # Planeación de cambios
```

---

## Variables de Entorno (.env)

| Variable | Default | Descripción |
|---|---|---|
| **Despliegue** | | |
| DEPLOYMENT_MODE | intranet | `cloud` o `intranet` |
| DOMAIN_URL | | Dominio del cliente (solo cloud) |
| LETSENCRYPT_EMAIL | | Email para Let's Encrypt (solo cloud) |
| **MQTT** | | |
| MQTT_BROKER | localhost | Broker MQTT |
| MQTT_PORT | 1883 | Puerto MQTT |
| MQTT_USE_TLS | false | Habilitar TLS para MQTT |
| MQTT_USER | | Usuario MQTT (EMQX auth) |
| MQTT_PASS | | Contraseña MQTT (EMQX auth) |
| **JWT** | | |
| JWT_SECRET | (requerido) | Clave HMAC-SHA256, mínimo 32 caracteres |
| JWT_EXPIRES_IN | 1h | Expiración del token |
| **SuperAdmin** | | |
| SUPER_ADMIN_USERNAME | admin | Usuario inicial |
| SUPER_ADMIN_PASSWORD | admin123 | Contraseña inicial |
| **Bridge** | | |
| PLC_HOST | 192.168.1.100 | IP del PLC |
| PLC_PORT | 502 | Puerto Modbus TCP |
| PLANTA | p1 | Identificador de planta |
| AREA | a1 | Identificador de área |
| SIMULATION | true | Usar simulación |
| **Frontend** | | |
| VITE_API_BASE | http://localhost:5000 | URL base de la API |

---

## API (.NET Core 10)

### Stack
- .NET 10 (Web API)
- PostgreSQL (Entity Framework Core)
- MQTTnet 5.x (suscriptor MQTT)
- JWT Bearer Authentication (httpOnly cookie)
- BCrypt.Net-Next (hash de contraseñas)
- DotNetEnv (carga de .env)
- System.Net.WebSockets

### Endpoints REST

| Método | Endpoint | Auth | Roles | Descripción |
|---|---|---|---|---|
| POST | `/api/auth/login` | No | — | Login, devuelve cookie JWT |
| POST | `/api/auth/logout` | Sí | Todos | Limpiar cookie |
| POST | `/api/auth/register` | Sí | Admin+ | Crear usuario |
| PUT | `/api/auth/complete-profile` | Sí | Todos | Completar perfil 1er login |
| GET | `/api/auth/me` | Sí | Todos | Ver perfil propio |
| PUT | `/api/auth/me` | Sí | Todos | Editar perfil propio |
| DELETE | `/api/auth/me` | Sí | Admin, Viewer | Auto-eliminarse |
| GET | `/api/auth/users` | Sí | Admin+ | Listar usuarios |
| DELETE | `/api/auth/users/{id}` | Sí | Admin+ | Eliminar usuario |
| GET | `/api/plantas` | Sí | Todos | Listar plantas |
| GET | `/api/areas` | Sí | Todos | Listar áreas |
| GET | `/api/sensores` | Sí | Todos | Listar sensores |
| POST | `/api/sensores` | Sí | Admin, SA | Crear sensor |
| PUT | `/api/sensores/{id}` | Sí | Admin, SA | Actualizar sensor |
| DELETE | `/api/sensores/{id}` | Sí | Admin, SA | Eliminar sensor |
| GET | `/api/datos` | Sí | Todos | Datos históricos |
| GET | `/api/tipos-grafico` | Sí | Todos | Tipos de gráfico |
| GET | `/api/unidades` | Sí | Todos | Unidades |

### Roles

| Acción | SuperAdmin | Admin | Viewer |
|---|---|---|---|
| Ver dashboard y datos | ✅ | ✅ | ✅ |
| CRUD sensores | ✅ | ✅ | ❌ |
| Crear Admin | ✅ | ❌ | ❌ |
| Crear/eliminar Viewer | ✅ | ✅ | ❌ |
| Eliminar Admin | ✅ | ❌ | ❌ |
| Editar perfil propio | ✅ | ✅ | ✅ |
| Editar perfil ajeno | ❌ | ❌ | ❌ |
| Auto-eliminarse | ❌ | ✅ | ✅ |

### WebSocket
- **Endpoint**: `ws://host:5000/ws/realtime?planta=p1&area=a1`
- **Auth**: JWT cookie validada antes del upgrade
- **Control**: START al conectar, STOP al desconectar
- **Forward**: Datos realtime del bridge al cliente

### Services
- **JwtService**: Generación/validación de tokens HS256 con claims (userId, username, rol, mustUpdateProfile)
- **MqttSubscriberService**: BackgroundService, suscrito a `industrial/+/+/history` y `industrial/+/+/realtime`
- **WebSocketRealtimeService**: Singleton, maneja conexiones WebSocket por planta/área
- **ProfileCompletionMiddleware**: Bloquea acceso a endpoints si `DebeCambiarInfo=true`

---

## Frontend (React + Vite + Tailwind)

### Stack
- React 19, React Router 7, Tailwind CSS 4, Recharts
- Vite 8, ESLint

### Rutas

| Ruta | Layout | Auth | Descripción |
|---|---|---|---|
| `/login` | PublicLayout | No | Login |
| `/complete-profile` | PublicLayout | Sí | Completar perfil 1er login |
| `/` | AuthLayout | Sí | Dashboard con sensores en tiempo real |
| `/users` | AuthLayout | Admin+ | Gestión de usuarios |

### Componentes
- `AuthContext`: Estado de autenticación, login/logout, verificación de sesión
- `ProtectedRoute`: Redirige a login si no autenticado, a complete-profile si mustUpdateProfile
- `api.js`: Fetch wrapper con `credentials: 'include'`, manejo de 401/403, WebSocket URL builder

### Variables de Entorno
- `VITE_API_BASE`: URL base de la API (default: `http://localhost:5000`)

---

## Tests

### xUnit (api.Tests/)
- 42 tests en 3 suites: JwtService (6), AuthController (24), Authorization (12)
- Usa `WebApplicationFactory` + InMemory Database (sin Docker ni PostgreSQL)
- Modo test activado con `INTEGRATION_TEST=true` en Program.cs
- Ejecutar: `cd api.Tests && dotnet test`

### Playwright (frontend)
- 10 tests end-to-end desde login hasta dashboard con datos en tiempo real
- Headless Chromium, verifica flujos completos de usuario

---

## Comandos Útiles

```bash
# Iniciar servicios Docker
cd docker && docker compose up -d

# Iniciar API (las variables se leen del .env automáticamente con DotNetEnv)
cd api && dotnet run --urls "http://0.0.0.0:5000"

# Iniciar Frontend
cd frontend && npm run dev -- --host 0.0.0.0

# Iniciar Bridge (simulación)
cd bridge && python main.py

# Compilar API
export PATH="$PATH:/home/oscarr093/.dotnet" && cd api && dotnet build

# Ejecutar tests xUnit
cd api.Tests && dotnet test

# Ejecutar tests Playwright
cd /tmp && node frontend-test.js

# Crear migración EF
export PATH="$PATH:/home/oscarr093/.dotnet:/home/oscarr093/.dotnet/tools"
cd api && dotnet ef migrations add NombreMigracion

# Aplicar migración
cd api && dotnet ef database update
```

---

## Estado del Sistema (2026-07-12)

### Completado
- [x] API .NET 10 con REST + WebSocket
- [x] PostgreSQL con Entity Framework
- [x] MqttSubscriberService + WebSocketRealtimeService
- [x] Autenticación JWT httpOnly cookie con 3 roles
- [x] Gestión de usuarios con jerarquía de roles
- [x] Flujo de primer inicio de sesión (completar perfil)
- [x] MQTT con credenciales y TLS opcional (bridge + API)
- [x] Frontend React con Tailwind (login, dashboard, gestión usuarios)
- [x] xUnit tests (42 tests, InMemory DB)
- [x] Playwright E2E tests (10 tests)

### Pendiente
- [ ] Docker Compose cloud con Traefik + Let's Encrypt
- [ ] Dockerfiles para API y Frontend
- [ ] Verificación integral con despliegue Docker
- [ ] EMQX: bloquear conexiones anónimas en cloud (requiere dashboard o config file)

---

## Autores

Sistema Monitoreo Industrial - 2026-07-12
