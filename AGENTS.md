# Sistema de Monitoreo Industrial - Documentación de Desarrollo

## Fecha: 2026-07-26

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
│   └── docker-compose.yml            # EMQX + PostgreSQL
├── api/                              # .NET 10 Web API
│   ├── Models/
│   │   ├── Planta.cs, Area.cs        # Planta y Area con Alias editable
│   │   ├── TipoGrafico.cs            # 5 tipos: línea, gauge, bar, status, counter
│   │   ├── Unidad.cs                 # Unidades personalizables (CRUD)
│   │   ├── Sensor.cs                 # + ModoDigital (estado|contador) + alarmas
│   │   ├── DatoSensor.cs             # + Cambios (transiciones/incrementos)
│   │   ├── Usuario.cs                # Auth: roles + perfil
│   │   ├── ConfiguracionAlarma.cs    # Canales de notificación
│   │   └── Dtos.cs                   # LoginRequest, RegisterRequest, SensorUpdateDto, etc.
│   ├── Data/
│   │   └── AppDbContext.cs           # Configuración EF + seed data
│   ├── Controllers/
│   │   ├── AuthController.cs         # Login, register, complete-profile, users CRUD
│   │   ├── PlantasController.cs      # GET + PUT (nombre, alias)
│   │   ├── AreasController.cs        # GET + PUT (nombre, alias)
│   │   ├── SensoresController.cs     # CRUD + PUT con SensorUpdateDto
│   │   ├── DatosController.cs        # GET con agregación diaria para contadores
│   │   ├── TiposGraficoController.cs # GET
│   │   ├── UnidadesController.cs     # CRUD completo + validación de uso
│   │   └── WebSocketController.cs
│   ├── Services/
│   │   ├── JwtService.cs             # Generación/validación JWT
│   │   ├── MqttSubscriberService.cs  # Suscriptor MQTT + auto-creación por modo
│   │   ├── WebSocketRealtimeService.cs # WebSocket con control START/STOP
│   │   └── AlarmService.cs           # Verificación + despacho Telegram/Email
│   ├── Middleware/
│   │   └── ProfileCompletionMiddleware.cs
│   ├── Migrations/
│   └── Program.cs
├── api.Tests/                        # xUnit tests (47 tests, InMemory DB)
│   ├── CustomWebApplicationFactory.cs
│   ├── JwtServiceTests.cs
│   ├── AuthControllerTests.cs
│   ├── AuthorizationTests.cs
│   └── SensorAreaAliasTests.cs
├── bridge/                           # Python bridge
│   ├── config.py
│   ├── sensors.py                    # Definición de sensores con modo
│   ├── plc_simulation.py             # Simulación: analógico, estado, contador
│   ├── mqtt_client.py
│   ├── control_client.py
│   ├── threads.py
│   └── main.py
├── frontend/                         # React + Vite + Tailwind
│   ├── src/
│   │   ├── services/
│   │   │   ├── api.js                # fetch wrapper con withCredentials
│   │   │   ├── displayNames.js       # Alias || identificador técnico
│   │   │   ├── sensorZones.js        # Agrupación por tipo de sensor
│   │   │   └── icons.js
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── NavigationBar.jsx
│   │   │   ├── LocationSelector.jsx  # Edición de planta + área (Admin+)
│   │   │   ├── SensorCard.jsx        # Variantes: analógico, estado, contador
│   │   │   │                          # Modal con: tipo/unidad, alarmas, historial
│   │   │   └── SensorZone.jsx
│   │   ├── layouts/PublicLayout.jsx, AuthLayout.jsx
│   │   └── pages/Login.jsx, CompleteProfile.jsx, Dashboard.jsx, UserManagement.jsx
│   └── package.json
├── .env, .env.example
├── AGENTS.md
├── README.md
└── openspec/                         # Planeación de cambios
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
| HISTORY_INTERVAL | 1200 | Intervalo de history en segundos |
| REALTIME_INTERVAL | 2 | Intervalo de realtime en segundos |
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
| PUT | `/api/plantas/{id}` | Sí | Admin, SA | Editar nombre y alias de planta |
| GET | `/api/areas` | Sí | Todos | Listar áreas |
| PUT | `/api/areas/{id}` | Sí | Admin, SA | Editar nombre y alias de área |
| GET | `/api/sensores` | Sí | Todos | Listar sensores (incluye unidad, tipoGrafico, área) |
| POST | `/api/sensores` | Sí | Admin, SA | Crear sensor |
| PUT | `/api/sensores/{id}` | Sí | Admin, SA | `SensorUpdateDto`: alias, nombre, tipoDato, modoDigital, unidadId, tipoGraficoId, alarmas |
| DELETE | `/api/sensores/{id}` | Sí | Admin, SA | Eliminar sensor |
| GET | `/api/datos` | Sí | Todos | Datos históricos con filtro `?from=&to=`. Para contadores: `?agregar=diario` |
| POST | `/api/datos` | Sí | Todos | Crear dato (usado por MqttSubscriberService) |
| GET | `/api/tipos-grafico` | Sí | Todos | Tipos de gráfico |
| GET | `/api/unidades` | Sí | Todos | Unidades |
| POST | `/api/unidades` | Sí | Admin, SA | Crear unidad personalizada |
| PUT | `/api/unidades/{id}` | Sí | Admin, SA | Editar unidad |
| DELETE | `/api/unidades/{id}` | Sí | Admin, SA | Eliminar (solo si ningún sensor la usa) |

### Roles

| Acción | SuperAdmin | Admin | Viewer |
|---|---|---|---|
| Ver dashboard y datos | ✅ | ✅ | ✅ |
| CRUD sensores | ✅ | ✅ | ❌ |
| Editar alias/nombre de planta, área, sensor | ✅ | ✅ | ❌ |
| CRUD unidades | ✅ | ✅ | ❌ |
| Configurar tipo gráfico y unidad del sensor | ✅ | ✅ | ❌ |
| Crear Admin | ✅ | ❌ | ❌ |
| Crear/eliminar Viewer | ✅ | ✅ | ❌ |
| Eliminar Admin | ✅ | ❌ | ❌ |
| Editar perfil propio | ✅ | ✅ | ✅ |
| Editar perfil ajeno | ❌ | ❌ | ❌ |
| Auto-eliminarse | ❌ | ✅ | ✅ |

### Tipos de Sensores

| Tipo | `TipoDato` | `ModoDigital` | Widget por defecto | Alarma | Visualización |
|---|---|---|---|---|---|
| Analógico | `analogico` | `null` | línea/gauge/bar (seleccionable) | Rango min/max | Valor + gráfico + unidad |
| Digital Estado | `digital` | `estado` | Indicador LED (fijo) | ON u OFF | ON/OFF + LED |
| Digital Contador | `digital` | `contador` | Barras diarias (fijo) | Rango min/max | Valor acumulado + delta |

### Modelo de Datos MQTT

```json
{
  "sensor": "c1",
  "valor": 1247,
  "tipo": "digital",
  "modo": "contador",
  "cambios": 23,
  "timestamp": 1713500000.0
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `sensor` | string | Identificador del sensor (ej: "c1") |
| `valor` | number | Valor actual (acumulado en contadores, estado 0/1 en digitales) |
| `tipo` | string | `"analogico"` o `"digital"` |
| `modo` | string | `"estado"` o `"contador"` (solo digitales, default "estado") |
| `cambios` | int | Incrementos/transiciones desde el último history (0 en realtime) |
| `timestamp` | float | Unix timestamp |

### WebSocket
- **Endpoint**: `ws://host:5000/ws/realtime?planta=p1&area=a1`
- **Auth**: JWT cookie validada antes del upgrade
- **Control**: START al conectar, STOP al desconectar
- **Forward**: Datos realtime del bridge al cliente
- **Importante**: Los datos realtime no incluyen `cambios` (siempre 0). El campo `cambios` solo es relevante en el topic history.

### Services
- **JwtService**: Generación/validación de tokens HS256 con claims (userId, username, rol, mustUpdateProfile)
- **MqttSubscriberService**: BackgroundService, suscrito a `industrial/+/+/history` y `industrial/+/+/realtime`. Auto-crea sensores según `tipo` y `modo` del mensaje MQTT.
- **WebSocketRealtimeService**: Singleton, maneja conexiones WebSocket por planta/área
- **AlarmService**: Evalúa valores contra rangos/alarmas configuradas. Despacha notificaciones Telegram/Email con rate limiting de 5 min.
- **ProfileCompletionMiddleware**: Bloquea acceso a endpoints si `DebeCambiarInfo=true`

### DTOs de actualización

```csharp
// PUT /api/sensores/{id} — solo se actualizan los campos enviados (null = sin cambios)
public class SensorUpdateDto
{
    public string? Alias { get; set; }
    public string? Nombre { get; set; }
    public string? TipoDato { get; set; }
    public string? ModoDigital { get; set; }
    public int? UnidadId { get; set; }
    public int? TipoGraficoId { get; set; }
    public bool? AlarmaActiva { get; set; }
    public decimal? RangoMinimo { get; set; }
    public decimal? RangoMaximo { get; set; }
    public bool? AlarmaEnOn { get; set; }
    public bool? AlarmaEnOff { get; set; }
}

// PUT /api/plantas/{id} y /api/areas/{id}
public class AreaUpdateDto
{
    public string? Nombre { get; set; }
    public string? Alias { get; set; }
}
```

### Validaciones del PUT de sensores

- `ModoDigital` debe ser `"estado"` o `"contador"` si `tipoDato` es `"digital"`, `null` si es `"analogico"`
- Sensores `contador` no pueden tener `AlarmaEnOn`/`AlarmaEnOff` activos
- Sensores `estado` no pueden tener `RangoMinimo`/`RangoMaximo`
- `AlarmaEnOn` y `AlarmaEnOff` son mutuamente excluyentes
- `RangoMinimo < RangoMaximo`

---

## Bridge (Python)

### Sensores simulados

```python
# bridge/sensors.py
SENSORES = [
    {"id": "s1", "registro": 0,   "tipo": "analogico"},
    {"id": "s2", "registro": 1,   "tipo": "analogico"},
    {"id": "s3", "registro": 2,   "tipo": "analogico"},
    {"id": "s4", "registro": 3,   "tipo": "analogico"},
    {"id": "d1", "registro": 100, "tipo": "digital", "modo": "estado"},
    {"id": "d2", "registro": 101, "tipo": "digital", "modo": "estado"},
    {"id": "c1", "registro": 200, "tipo": "digital", "modo": "contador"},
]
```

### Comportamiento por tipo

| Tipo | Simulación | Valor |
|---|---|---|
| Analógico | Variación ±2 alrededor de 100–200 | float |
| Digital Estado | 5% probabilidad de flip 0↔1 por tick | 0 o 1 |
| Digital Contador | Incremento 0–3 por tick, nunca decrece | entero acumulado |

### Métodos del PLC simulado

| Método | Uso | `cambios` |
|---|---|---|
| `leer_datos()` | Realtime (2s) | Siempre 0 |
| `leer_history()` | History (20 min) | Acumulado desde último history, luego resetea |

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
| `/` | AuthLayout | Sí | Dashboard con sensores en tiempo real, selector de ubicación y zonas |
| `/users` | AuthLayout | Admin+ | Gestión de usuarios |
| `/settings` | AuthLayout | Sí | Configuración del sistema (placeholder) |

### Componentes
- **AuthContext**: Estado de autenticación, login/logout, verificación de sesión
- **ProtectedRoute**: Redirige a login si no autenticado, a complete-profile si mustUpdateProfile
- **api.js**: Fetch wrapper con `credentials: 'include'`, manejo de 401/403, WebSocket URL builder
- **displayNames.js**: Helpers `getSensorDisplayName`, `getAreaDisplayName`, `getPlantaDisplayName` (alias || identificador técnico)
- **NavigationBar**: Barra superior con estado WebSocket, alertas, timestamp, expandir/colapsar zonas
- **LocationSelector**: Panel de selección planta/área. Botón de edición para renombrar planta y área (Admin+). Soporta nombre y alias.
- **SensorCard**: Tarjeta con tres variantes:
  - **Analógico**: Valor + unidad + gráfico (línea/gauge/barra según configuración)
  - **Digital Estado**: Indicador ON/OFF + LED + unidad
  - **Digital Contador**: Número grande acumulado + unidad + delta del periodo
- **SensorDetailModal**: Modal con:
  - Estadísticas (actual, mín/máx, promedio)
  - Selector de rango de fechas para historial
  - Tabla de estados ON/OFF (digital estado) o gráfica (analógico/contador)
  - Barras diarias para contadores con rango multi-día
  - Sección **Tipo y unidad**: cambio de tipoGráfico + unidad + botón "Nueva unidad" (Admin+)
  - Sección **Configuración de Alarma**: según tipo de sensor
  - Botón **Guardar configuración** (actualiza la tarjeta sin recargar)
- **SensorZone**: Zona colapsable con grid de sensores, agrupados por tipo (Temperaturas, Presiones, Eléctricos, Motores, Contadores, General)

### Variables de Entorno
- `VITE_API_BASE`: URL base de la API (default: `http://localhost:5000`)

### Flujo de actualización de sensor

```
Modal: cambiar tipo/unidad → Guardar configuración
  → PUT /api/sensores/{id} (SensorUpdateDto)
  → onSensorUpdate(id, updates) → Dashboard.setSensores(...)
  → tarjeta se re-renderiza con nuevos valores (sin refresh)
```

---

## Tests

### xUnit (api.Tests/)
- 47 tests en 5 suites: JwtService (6), AuthController (24), Authorization (12), SensorAreaAlias (5)
- Usa `WebApplicationFactory` + InMemory Database (sin Docker ni PostgreSQL)
- Modo test activado con `INTEGRATION_TEST=true` en Program.cs
- Ejecutar: `cd api.Tests && dotnet test`

### Playwright (frontend)
- Tests end-to-end desde login hasta dashboard, alias, tipos de sensor, cambio de unidad
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

## Estado del Sistema (2026-07-26)

### Completado
- [x] API .NET 10 con REST + WebSocket
- [x] PostgreSQL con Entity Framework
- [x] MqttSubscriberService + WebSocketRealtimeService + AlarmService
- [x] Autenticación JWT httpOnly cookie con 3 roles
- [x] Gestión de usuarios con jerarquía de roles
- [x] Flujo de primer inicio de sesión (completar perfil)
- [x] MQTT con credenciales y TLS opcional (bridge + API)
- [x] Sensores analógicos con gráficos seleccionables (línea, gauge, bar)
- [x] Sensores digitales de estado (LED ON/OFF) con alarmas en ON y OFF
- [x] Sensores digitales de contador (acumulador) con barras diarias y agregación
- [x] Alarmas configurables por tipo de sensor con rate limiting (Telegram + Email)
- [x] Unidades personalizables (CRUD por Admin con validación de uso)
- [x] Renombrar plantas, áreas y sensores (nombre + alias desde el frontend)
- [x] Configuración de gráfico y unidad desde el modal sin recargar
- [x] Bridge con simulación de 3 tipos de sensores
- [x] Frontend React con Tailwind (login, dashboard, gestión usuarios)
- [x] xUnit tests (47 tests, InMemory DB)
- [x] Playwright E2E tests

### Pendiente
- [ ] Docker Compose cloud con Traefik + Let's Encrypt
- [ ] Dockerfiles para API y Frontend
- [ ] Verificación integral con despliegue Docker
- [ ] EMQX: bloquear conexiones anónimas en cloud (requiere dashboard o config file)

---

## Autores

Sistema Monitoreo Industrial - 2026-07-26
