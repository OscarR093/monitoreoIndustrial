# Sistema de Monitoreo Industrial — Documentación de Desarrollo

**Última actualización:** 2026-07-28

---

## Arquitectura

```
PLC (real o simulado) → Bridge (Python) → MQTT (EMQX) → API (.NET 10) ↔ WebSocket ↔ Frontend (React)
```

### Tipos de datos MQTT

| Topic | Intervalo | Persiste en DB | Dispara alarmas | Propósito |
|---|---|---|---|---|
| `industrial/{p}/{a}/history` | 300s (configurable) | Sí | Sí | Historial + alarmas |
| `industrial/{p}/{a}/realtime` | 2s (solo con START) | No | No | Visualización en dashboard |

### Flujo de datos

```
Bridge publica en history (cada 5 min)
  → MQTT → MqttSubscriberService → INSERT en DatosSensores → AlarmService.VerificarAsync

Bridge publica en realtime (cada 2s, solo si hay clientes WebSocket)
  → MQTT → WebSocketRealtimeService → forward a clientes WebSocket
  → MqttSubscriberService → auto-crea sensor si no existe (NO guarda dato, NO verifica alarmas)
```

### Control START/STOP

- WebSocketRealtimeService publica START en `industrial/{p}/{a}/control` al conectar el primer cliente
- Publica STOP al desconectar el último cliente
- El bridge detiene el hilo de realtime cuando no hay espectadores

### Seguridad

- **API ↔ Frontend:** JWT httpOnly cookie, 3 roles (SuperAdmin, Admin, Viewer)
- **MQTT:** user/password vía `MQTT_USER`/`MQTT_PASS`
- **TLS:** Modo cloud con Traefik + Let's Encrypt. Modo intranet sin TLS.
- **CORS:** Cloud restringido al dominio, intranet con `SetIsOriginAllowed(_ => true)`
- **Data masking:** Email y teléfono enmascarados en todas las respuestas de API. El dato real solo existe en DB y servicios de notificación.

---

## Estructura

```
monitoreoIndustrial/
├── docker/docker-compose.yml         # EMQX + PostgreSQL
├── api/                              # .NET 10 Web API
│   ├── Controllers/
│   │   ├── AuthController.cs         # Login, registro, perfil, usuarios, data masking
│   │   ├── DatosController.cs        # GET con filtro, agregación diaria para contadores
│   │   ├── SensoresController.cs     # CRUD + PUT con SensorUpdateDto
│   │   ├── PlantasController.cs      # GET + PUT (nombre, alias)
│   │   ├── AreasController.cs        # GET + PUT (nombre, alias)
│   │   ├── UnidadesController.cs     # CRUD + validación de uso
│   │   └── TiposGraficoController.cs # GET
│   ├── Services/
│   │   ├── JwtService.cs             # Generación/validación JWT HS256
│   │   ├── MqttSubscriberService.cs  # Suscriptor MQTT (history + realtime)
│   │   ├── WebSocketRealtimeService.cs # Forward realtime + control START/STOP
│   │   └── AlarmService.cs           # Verificación + despacho Telegram/Email
│   ├── Helpers/
│   │   └── DataMasker.cs             # Enmascaramiento de email/teléfono
│   ├── Middleware/
│   │   └── ProfileCompletionMiddleware.cs
│   ├── Models/                       # Planta, Area, Sensor, DatoSensor, Usuario, etc.
│   ├── Data/AppDbContext.cs          # Configuración EF + seed data
│   └── Program.cs
├── api.Tests/                        # xUnit (47 tests, InMemory DB)
├── bridge/                           # Python
│   ├── main.py                       # Punto de entrada
│   ├── plc_simulation.py             # Simulación: analógico, estado, contador
│   ├── mqtt_client.py                # Cliente MQTT (paho-mqtt)
│   ├── threads.py                    # Hilos history/realtime con control START/STOP
│   ├── sensors.py                    # Definición de sensores
│   └── config.py                     # Configuración desde .env
├── frontend/                         # React 19 + Vite 8 + Tailwind 4
│   └── src/
│       ├── components/
│       │   ├── SensorCard.jsx        # Tarjeta con 3 variantes + modal con tabs
│       │   ├── SensorZone.jsx        # Zona colapsable con grid de sensores
│       │   ├── NavigationBar.jsx     # Header: reloj, WS status, alertas
│       │   ├── LocationSelector.jsx  # Selector planta/área con edición inline
│       │   ├── ProtectedRoute.jsx    # Guard de autenticación + perfil
│       │   └── Sidebar.jsx           # Navegación lateral colapsable
│       ├── pages/
│       │   ├── Dashboard.jsx         # Dashboard principal con WebSocket
│       │   ├── Login.jsx             # Login
│       │   ├── CompleteProfile.jsx   # Completar perfil (1er login)
│       │   ├── UserManagement.jsx    # Gestión de usuarios (Admin+)
│       │   └── Settings.jsx          # Configuración con tabs
│       ├── context/
│       │   ├── AuthContext.jsx        # Estado de autenticación
│       │   └── ToastContext.jsx       # Sistema de notificaciones toast
│       ├── services/
│       │   ├── api.js                # Fetch wrapper + WebSocket URL builder
│       │   ├── displayNames.js       # Alias || identificador técnico
│       │   ├── sensorZones.js        # Agrupación por tipo de sensor
│       │   └── icons.js              # Lucide icons centralizados
│       └── layouts/
│           ├── PublicLayout.jsx      # Centrado (login, complete-profile)
│           └── AuthLayout.jsx        # Sidebar + header (dashboard, users, settings)
├── openspec/                         # Planeación de cambios
├── PRODUCT.md                        # Contexto de producto
├── DESIGN.md                         # Sistema de diseño
├── .env / .env.example
├── AGENTS.md
└── README.md
```

---

## Stack

| Capa | Tecnología |
|---|---|
| API | .NET 10, EF Core, PostgreSQL, MQTTnet 5.x, BCrypt.Net-Next |
| Auth | JWT httpOnly cookie (HS256), 3 roles jerárquicos |
| Frontend | React 19, Vite 8, Tailwind CSS 4, Recharts, Lucide React |
| Bridge | Python 3, paho-mqtt, pymodbus (opcional) |
| Infra | Docker (EMQX, PostgreSQL), Traefik (cloud) |
| Tests | xUnit (47 tests, InMemory DB), Playwright E2E |

---

## API REST

| Método | Endpoint | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login, devuelve cookie JWT |
| POST | `/api/auth/logout` | Sí | Limpiar cookie |
| POST | `/api/auth/register` | Admin+ | Crear usuario |
| PUT | `/api/auth/complete-profile` | Sí | Completar perfil (1er login) |
| GET | `/api/auth/me` | Sí | Perfil propio (datos enmascarados) |
| PUT | `/api/auth/me` | Sí | Editar perfil propio |
| DELETE | `/api/auth/me` | Admin, Viewer | Auto-eliminarse |
| GET | `/api/auth/users` | Admin+ | Listar usuarios (datos enmascarados) |
| DELETE | `/api/auth/users/{id}` | Admin+ | Eliminar usuario |
| GET/PUT | `/api/plantas/{id}` | Admin+ | Nombre + alias |
| GET/PUT | `/api/areas/{id}` | Admin+ | Nombre + alias |
| GET/POST | `/api/sensores` | Todos/Admin+ | CRUD sensores |
| PUT | `/api/sensores/{id}` | Admin+ | SensorUpdateDto |
| DELETE | `/api/sensores/{id}` | Admin+ | — |
| GET/POST | `/api/datos` | Todos | Historial con filtro `?from=&to=` |
| GET | `/api/datos?agregar=diario` | Todos | Agregación diaria (contadores) |
| GET/POST/PUT/DELETE | `/api/unidades` | Admin+ | CRUD unidades |
| GET | `/api/tipos-grafico` | Todos | Tipos de gráfico |

---

## Roles

| Acción | SuperAdmin | Admin | Viewer |
|---|---|---|---|
| Dashboard + datos | ✅ | ✅ | ✅ |
| CRUD sensores | ✅ | ✅ | ❌ |
| CRUD unidades | ✅ | ✅ | ❌ |
| Editar planta/área | ✅ | ✅ | ❌ |
| Crear Admin | ✅ | ❌ | ❌ |
| Crear/eliminar Viewer | ✅ | ✅ | ❌ |
| Eliminar Admin | ✅ | ❌ | ❌ |
| Editar perfil propio | ✅ | ✅ | ✅ |
| Auto-eliminarse | ❌ | ✅ | ✅ |

---

## Sensores

| Tipo | Widgets | Alarma |
|---|---|---|
| **Analógico** (`analogico`) | línea, gauge, barra | Rango min/max |
| **Digital Estado** (`digital`, `estado`) | LED ON/OFF | ON u OFF |
| **Digital Contador** (`digital`, `contador`) | Número + barras diarias | Rango min/max |

---

## WebSocket

- **Endpoint:** `ws://host:5000/ws/realtime?planta=p1&area=a1`
- **Auth:** JWT cookie validada antes del upgrade
- **Comportamiento:** Forward de datos realtime del bridge al frontend. Sin persistencia en DB.

---

## Variables de Entorno

| Variable | Default | Descripción |
|---|---|---|
| `DEPLOYMENT_MODE` | intranet | `cloud` o `intranet` |
| `MQTT_BROKER` | localhost | Broker MQTT |
| `MQTT_PORT` | 1883 | Puerto MQTT |
| `MQTT_USER` | | Usuario EMQX |
| `MQTT_PASS` | | Contraseña EMQX |
| `JWT_SECRET` | (requerido) | Clave HMAC-SHA256, mínimo 32 caracteres |
| `SUPER_ADMIN_USERNAME` | admin | Usuario inicial |
| `SUPER_ADMIN_PASSWORD` | admin123 | Contraseña inicial |
| `PLC_HOST` | 192.168.1.100 | IP del PLC |
| `PLC_PORT` | 502 | Puerto Modbus TCP |
| `SIMULATION` | true | Usar simulación de PLC |
| `PLANTA` | p1 | Identificador de planta |
| `AREA` | a1 | Identificador de área |
| `HISTORY_INTERVAL` | 300 | Intervalo de history en segundos |
| `REALTIME_INTERVAL` | 2 | Intervalo de realtime en segundos |
| `VITE_API_BASE` | http://localhost:5000 | URL base de la API |

---

## Comandos

```bash
# Docker
cd docker && docker compose up -d

# API
cd api && dotnet run --urls "http://0.0.0.0:5000"

# Frontend
cd frontend && npm run dev -- --host 0.0.0.0

# Bridge
cd bridge && python main.py

# Tests
cd api.Tests && dotnet test

# Build
cd api && dotnet build
cd frontend && npm run build
```

---

## Historial de cambios notables (2026-07-26 → 2026-07-28)

- Separación realtime/history: solo history persiste en DB y dispara alarmas
- Data masking: email y teléfono enmascarados en todas las respuestas de API
- Modal del sensor rediseñado con tabs (Diagnóstico/Historial/Configuración)
- Tabla de historial con orden cronológico inverso (más reciente arriba)
- Tooltip en gráficos con valores exactos
- Confirmación al desactivar alarmas
- Sistema de toast para errores y confirmaciones
- Staleness indicator por sensor (opacidad + "hace Xs")
- Paleta rediseñada: ámbar industrial en vez de cian neón
- Tabs en Settings (Cuenta/Seguridad/Canales)
- Performance: React.memo en SensorCard + chart components, useMemo/useCallback, visibilityState
- Corrección de timestamp: `lastUpdate` usa el timestamp del bridge, no el reloj del navegador
- Placeholder:text-text-muted reparado en todos los formularios
- A11y: heading hierarchy, ARIA en modales, aria-labels, keyboard handlers
- Limpieza de código muerto (App.css, assets Vite)
- Favicon ámbar industrial
