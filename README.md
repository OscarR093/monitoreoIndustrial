# Sistema de Monitoreo Industrial

Sistema de monitoreo industrial con autenticación, autorización basada en roles, y visualización en tiempo real. Diseñado para despliegue single-tenant por cliente en modo intranet o cloud.

## Arquitectura

```
PLC (real o simulado) → Bridge → MQTT Broker (EMQX) → API (.NET) ↔ WebSocket ↔ Frontend
```

## Componentes

| Componente | Stack | Descripción |
|---|---|---|
| **Bridge** | Python, paho-mqtt, pymodbus | Lee datos del PLC y los publica en MQTT con TLS/credenciales opcionales |
| **EMQX** | Docker (emqx/emqx) | Broker MQTT con autenticación user/password |
| **PostgreSQL** | Docker (postgres:16) | Base de datos |
| **API** | .NET 10, EF Core, MQTTnet 5, JWT | REST API + WebSocket con autenticación y roles |
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, Recharts | Dashboard con sensores en tiempo real |

## Inicio Rápido

```bash
# 1. Docker (EMQX + PostgreSQL)
cd docker && docker compose up -d

# 2. API
cd api && dotnet run --urls "http://0.0.0.0:5000"

# 3. Bridge (terminal aparte, opcional)
cd bridge && python main.py

# 4. Frontend (terminal aparte)
cd frontend && npm run dev -- --host 0.0.0.0
```

Abrir http://localhost:5173 — credenciales: `admin` / `admin123`

## Puertos

| Servicio | Puerto |
|---|---|
| Frontend | 5173 |
| API | 5000 |
| EMQX MQTT | 1883 |
| EMQX Dashboard | 18083 |
| PostgreSQL | 5432 |

## Autenticación

- **API**: JWT httpOnly cookie con 3 roles (SuperAdmin, Admin, Viewer)
- **MQTT**: User/password en EMQX vía `MQTT_USER`/`MQTT_PASS`
- **TLS**: Traefik + Let's Encrypt en cloud, sin TLS en intranet

| Rol | Dashboard | CRUD Sensores | Gestión Usuarios |
|---|---|---|---|
| SuperAdmin | ✅ | ✅ | Admin + Viewer |
| Admin | ✅ | ✅ | Solo Viewer |
| Viewer | ✅ | ❌ | ❌ |

## API REST

| Método | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/login` | No |
| POST | `/api/auth/logout` | Sí |
| POST | `/api/auth/register` | Admin+ |
| GET | `/api/auth/me` | Sí |
| PUT | `/api/auth/me` | Sí |
| DELETE | `/api/auth/me` | Admin, Viewer |
| GET | `/api/auth/users` | Admin+ |
| DELETE | `/api/auth/users/{id}` | Admin+ |
| PUT | `/api/auth/complete-profile` | Sí |
| GET | `/api/plantas` | Sí |
| GET | `/api/areas` | Sí |
| GET | `/api/sensores` | Sí |
| POST | `/api/sensores` | Admin, SA |
| PUT | `/api/sensores/{id}` | Admin, SA |
| DELETE | `/api/sensores/{id}` | Admin, SA |
| GET | `/api/datos` | Sí |
| GET | `/api/tipos-grafico` | Sí |
| GET | `/api/unidades` | Sí |

## WebSocket

- **Endpoint**: `ws://host:5000/ws/realtime?planta=p1&area=a1`
- **Auth**: JWT cookie validada antes del upgrade
- **Control**: START al conectar, STOP al desconectar
- **Forward**: Datos realtime del bridge al cliente

## Topics MQTT

| Topic | Descripción |
|---|---|
| `industrial/{planta}/{area}/history` | Datos históricos (cada 20 min) |
| `industrial/{planta}/{area}/realtime` | Datos tiempo real (si START) |
| `industrial/{planta}/{area}/control` | Comandos START/STOP |

## Formato de Datos MQTT

```json
[
    {
        "sensor": "s1",
        "valor": 123.45,
        "timestamp": 1713500000.0
    }
]
```

## Variables de Entorno

| Variable | Default | Descripción |
|---|---|---|
| DEPLOYMENT_MODE | intranet | `cloud` o `intranet` |
| MQTT_BROKER | localhost | Broker MQTT |
| MQTT_PORT | 1883 | Puerto MQTT |
| MQTT_USE_TLS | false | TLS para MQTT |
| MQTT_USER | | Usuario EMQX |
| MQTT_PASS | | Contraseña EMQX |
| JWT_SECRET | (requerido) | Clave HMAC-SHA256 (mín 32 chars) |
| JWT_EXPIRES_IN | 1h | Expiración JWT |
| SUPER_ADMIN_USERNAME | admin | Usuario inicial |
| SUPER_ADMIN_PASSWORD | admin123 | Contraseña inicial |
| PLANTA | p1 | Planta del bridge |
| AREA | a1 | Área del bridge |
| SIMULATION | true | Simulación de PLC |

## Tests

```bash
# xUnit (42 tests, con InMemory DB)
cd api.Tests && dotnet test

# Playwright E2E (10 tests, con headless Chromium)
cd /tmp && node frontend-test.js
```

## Documentación

- [AGENTS.md](AGENTS.md) — Documentación de desarrollo detallada
- [openspec/](openspec/) — Planeación de cambios

## Estado

**Sistema funcional con:**
- [x] API REST + WebSocket con JWT httpOnly cookie
- [x] 3 roles jerárquicos (SuperAdmin, Admin, Viewer)
- [x] Gestión de usuarios con completar perfil en 1er login
- [x] MQTT con credenciales y TLS opcional
- [x] Frontend React con dashboard en tiempo real
- [x] 42 tests xUnit + 10 tests Playwright E2E
- [x] Bridge con simulación de PLC

**Pendiente:**
- [ ] Docker Compose cloud con Traefik + Let's Encrypt
- [ ] Dockerfiles para API y Frontend
- [ ] Bloquear conexiones MQTT anónimas en cloud (requiere dashboard EMQX)
