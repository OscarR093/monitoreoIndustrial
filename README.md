# ⚙️ Monitoreo Industrial

Sistema SCADA de monitoreo industrial con sensores analógicos y digitales, contadores MES/OEE, alarmas configurables y visualización en tiempo real. Diseñado para despliegue single-tenant por cliente en modo intranet o cloud.

```
 ██████╗ ██████╗ ██╗     ██████╗ ██╗               ██████╗ ██╗
██╔════╝ ██╔══██╗██║    ██╔════╝ ██║              ██╔═══██╗██║
██║      ██████╔╝██║    ██║     ███████╗           ██║   ██║██║
██║      ██╔═══╝ ██║    ██║     ╚════██║           ██║▄▄ ██║██║
╚██████╗ ██║     ██║    ╚██████╗     ██║           ╚██████╔╝██║
 ╚═════╝ ╚═╝     ╚═╝     ╚═════╝     ╚═╝            ╚══▀▀═╝ ╚═╝

    Bridge ──MQTT──▶ API (.NET) ──WebSocket──▶ Dashboard (React)
```

## Componentes

| Componente | Stack | Rol |
|---|---|---|
| **Bridge** | Python · paho-mqtt · pymodbus | Lee registros del PLC (real o simulado) y publica en MQTT |
| **EMQX** | Docker | Broker MQTT con autenticación user/password |
| **PostgreSQL** | Docker · EF Core | Almacenamiento de series temporales y configuración |
| **API** | .NET 10 · MQTTnet 5 · JWT | REST + WebSocket, suscripción MQTT, alarmas |
| **Frontend** | React 19 · Vite 8 · Tailwind 4 · Recharts | Dashboard en tiempo real con gráficos y alarmas |

## Inicio Rápido

```bash
# 1. Servicios Docker
cd docker && docker compose up -d

# 2. API
cd api && dotnet run --urls "http://0.0.0.0:5000"

# 3. Bridge (terminal aparte)
cd bridge && python main.py

# 4. Frontend (terminal aparte)
cd frontend && npm run dev -- --host 0.0.0.0
```

> Abrir http://localhost:5173 — credenciales iniciales: `admin` / `admin123`

### Puertos

| Servicio | Puerto |
|---|---|
| Frontend | 5173 |
| API | 5000 |
| EMQX MQTT | 1883 |
| EMQX Dashboard | 18083 |
| PostgreSQL | 5432 |

## Tipos de Sensores

```
┌──────────────────────────────────────────────────────────┐
│                    SENSORES                               │
├──────────────┬──────────────────┬────────────────────────┤
│  ANALÓGICO   │  DIGITAL ESTADO  │  DIGITAL CONTADOR      │
├──────────────┼──────────────────┼────────────────────────┤
│ Temperatura  │ Motor ON/OFF     │ Piezas producidas      │
│ Presión      │ Puerta abierta   │ Ciclos de máquina      │
│ Voltaje      │ Final de carrera │ Unidades rechazadas    │
│ Corriente    │ Nivel alto/bajo  │ Pulsos de encoder      │
├──────────────┼──────────────────┼────────────────────────┤
│ Widget:      │ Widget:          │ Widget:                │
│ línea/gauge  │ Indicador LED    │ Número + barras       │
│ /bar         │ (ON/OFF)         │ diarias                │
├──────────────┼──────────────────┼────────────────────────┤
│ Alarma por   │ Alarma en ON o   │ Alarma por rango       │
│ rango min/max│ Alarma en OFF    │ min/max (acumulado)    │
└──────────────┴──────────────────┴────────────────────────┘
```

- **Estado**: sensores binarios (0/1) — ideal para contactos, presencia, niveles
- **Contador**: acumuladores incrementales — pensado para MES, OEE, KPIs de producción
- El historial del contador muestra el total de activaciones por día en gráfica de barras

## Autenticación y Roles

| Rol | Dashboard | Sensores | Unidades | Plantas/Áreas | Usuarios |
|---|---|---|---|---|---|
| **SuperAdmin** | ✅ | CRUD | CRUD | Renombrar | Crear Admin + Viewer |
| **Admin** | ✅ | CRUD | CRUD | Renombrar | Crear Viewer |
| **Viewer** | ✅ | 👁️ | 👁️ | 👁️ | — |

- JWT httpOnly cookie
- MQTT autenticado con user/password
- TLS opcional vía Traefik + Let's Encrypt (modo cloud)

## API REST

### Auth
| Método | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/login` | — |
| POST | `/api/auth/register` | Admin+ |
| GET/PUT | `/api/auth/me` | Todos |
| GET | `/api/auth/users` | Admin+ |
| DELETE | `/api/auth/users/{id}` | Admin+ |

### Entidades
| Método | Endpoint | Auth | Notas |
|---|---|---|---|
| GET/PUT | `/api/plantas/{id}` | Admin+ | Nombre + alias editable |
| GET/PUT | `/api/areas/{id}` | Admin+ | Nombre + alias editable |
| GET/POST | `/api/sensores` | Todos/Admin+ | — |
| PUT | `/api/sensores/{id}` | Admin+ | Alias, nombre, tipo, unidad, alarmas |
| DELETE | `/api/sensores/{id}` | Admin+ | — |

### Unidades (personalizables)
| Método | Endpoint | Auth |
|---|---|---|
| GET | `/api/unidades` | Todos |
| POST | `/api/unidades` | Admin+ |
| PUT | `/api/unidades/{id}` | Admin+ |
| DELETE | `/api/unidades/{id}` | Admin+ |

> 8 unidades por defecto: °C, PSI, V, A, %, RPM, ON/OFF, ud.  
> El Admin puede crear las suyas (ej: °F, bar, kg, L/h).

### Datos
| Método | Endpoint | Notas |
|---|---|---|
| GET | `/api/datos` | Filtro por sensor, planta, área, rango de fechas |
| GET | `/api/datos?agregar=diario` | Agregación diaria para contadores MES/OEE |

### Alarmas

| Tipo de sensor | Configuración | Disparador |
|---|---|---|
| Analógico | `rangoMinimo` / `rangoMaximo` | Valor fuera de rango |
| Digital estado | `alarmaEnOn` / `alarmaEnOff` | Valor = 1 o Valor = 0 |
| Digital contador | `rangoMinimo` / `rangoMaximo` | Acumulado fuera de rango |

> Cooldown de 5 minutos entre notificaciones. Canales: Telegram y Email.

## WebSocket

- **Endpoint**: `ws://host:5000/ws/realtime?planta=p1&area=a1`
- **Auth**: JWT cookie validada antes del upgrade
- **Control**: START al conectar cliente, STOP al desconectar — el bridge solo transmite datos en tiempo real si hay espectadores

## Topics MQTT

| Topic | Frecuencia | Contenido |
|---|---|---|
| `industrial/{p}/{a}/realtime` | 2s (si activo) | Estado actual de cada sensor |
| `industrial/{p}/{a}/history` | 20 min | Valores + contador de cambios |
| `industrial/{p}/{a}/control` | Bajo demanda | Comandos START / STOP |

### Formato del mensaje

```json
[
  {
    "sensor": "c1",
    "valor": 1247,
    "tipo": "digital",
    "modo": "contador",
    "cambios": 23,
    "timestamp": 1713500000.0
  }
]
```

| Campo | Descripción |
|---|---|
| `tipo` | `"analogico"` o `"digital"` |
| `modo` | `"estado"` o `"contador"` (solo digitales) |
| `cambios` | Transiciones/incrementos desde el último history |

## Variables de Entorno

| Variable | Default | Descripción |
|---|---|---|
| `DEPLOYMENT_MODE` | intranet | `cloud` o `intranet` |
| `MQTT_BROKER` | localhost | Host del broker MQTT |
| `MQTT_PORT` | 1883 | Puerto MQTT |
| `MQTT_USE_TLS` | false | TLS para MQTT |
| `MQTT_USER` | | Usuario EMQX |
| `MQTT_PASS` | | Contraseña EMQX |
| `JWT_SECRET` | (requerido) | HMAC-SHA256, mín 32 chars |
| `SUPER_ADMIN_USERNAME` | admin | Usuario inicial |
| `SUPER_ADMIN_PASSWORD` | admin123 | Contraseña inicial |
| `PLANTA` | p1 | Planta del bridge |
| `AREA` | a1 | Área del bridge |
| `SIMULATION` | true | Usar simulación de PLC |
| `VITE_API_BASE` | http://localhost:5000 | URL base de la API |

## Tests

```bash
# xUnit — 47 tests con InMemory DB
cd api.Tests && dotnet test

# Playwright E2E — headless Chromium
cd /tmp && node frontend-test.js
```

## Documentación

- [AGENTS.md](AGENTS.md) — Documentación de desarrollo (arquitectura, endpoints, stack, comandos)
- [openspec/](openspec/) — Planeación y seguimiento de cambios

## Estado

- [x] API REST + WebSocket con JWT httpOnly cookie
- [x] 3 roles jerárquicos (SuperAdmin, Admin, Viewer)
- [x] Sensores analógicos con gráficos seleccionables (línea, gauge, barra)
- [x] Sensores digitales de estado (LED ON/OFF) y contador (barras diarias)
- [x] Contadores MES/OEE con agregación diaria de activaciones
- [x] Alarmas configurables por sensor con rate limiting (Telegram + Email)
- [x] Unidades personalizables (CRUD por Admin)
- [x] Renombrar plantas, áreas y sensores (alias + nombre)
- [x] Configuración de tipo de gráfico y unidad desde el modal del sensor
- [x] Bridge con simulación de PLC (analógicos, digital estado, digital contador)
- [x] 47 tests xUnit + tests Playwright E2E
