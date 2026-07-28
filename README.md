<div align="center">

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   ███████╗ ██████╗ █████╗ ██████╗  █████╗                        ║
║   ██╔════╝██╔════╝██╔══██╗██╔══██╗██╔══██╗                       ║
║   ███████╗██║     ███████║██║  ██║███████║                       ║
║   ╚════██║██║     ██╔══██║██║  ██║██╔══██║                       ║
║   ███████║╚██████╗██║  ██║██████╔╝██║  ██║                       ║
║   ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝                       ║
║                                                                  ║
║        ╔═══════════════════════════════════════════════╗         ║
║        ║    S I S T E M A   D E   M O N I T O R E O   ║         ║
║        ║           I N D U S T R I A L                 ║         ║
║        ╚═══════════════════════════════════════════════╝         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

### Dashboard SCADA para monitoreo en tiempo real de sensores industriales

<br>

```
  PLC ──MQTT──▶ API (.NET) ──WebSocket──▶ Dashboard (React)
   │                │                          │
   │       ┌────────┴────────┐          ┌──────┴──────┐
   │       │   PostgreSQL    │          │  Navegador  │
   │       │   Alarmas       │          │  Tiempo real│
   │       │   Telegram/Email│          └─────────────┘
   │       └─────────────────┘
   │
   └── Simulación incluida ── sin hardware necesario
```

</div>

---

## ⚡ ¿Qué hace?

Sistema industrial autocontenido que recolecta datos de sensores vía PLC (real o simulado), los transmite por MQTT, los almacena en PostgreSQL y los visualiza en un **dashboard web en tiempo real** con WebSocket. Incluye alarmas configurables con notificaciones por Telegram y correo electrónico.

```
┌──────────────────────────────────────────────────────────────────┐
│                        DASHBOARD                                  │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │  247.5  │  │   ON    │  │  1247   │  │  189.2  │             │
│  │   °C    │  │  MOTOR  │  │   ud    │  │   PSI   │             │
│  │ ╱╲╱╲╱╲  │  │   ●━━━  │  │  ████▓  │  │ ╱╲╱╲╱╲  │             │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘             │
│  ┌──────────────────────────────────────────────────┐           │
│  │ Temperaturas    ▾  4/4 activos                    │           │
│  └──────────────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

### Tres tipos de sensor

| | Analógico | Digital Estado | Digital Contador |
|---|---|---|---|
| **Ejemplo** | Temperatura, presión | Motor ON/OFF, puerta | Piezas producidas |
| **Widget** | Línea · Gauge · Barra | Indicador LED | Número + barras diarias |
| **Alarma** | Fuera de rango | ON / OFF | Fuera de rango |

---

## 🚀 Inicio rápido

```bash
# 1. Levantar infraestructura
cd docker && docker compose up -d       # EMQX + PostgreSQL

# 2. API (terminal 1)
cd api && dotnet run --urls "http://0.0.0.0:5000"

# 3. Bridge con simulación (terminal 2)
cd bridge && python main.py              # 7 sensores simulados

# 4. Frontend (terminal 3)
cd frontend && npm install && npm run dev -- --host 0.0.0.0
```

> Abrir **http://localhost:5173** — credenciales: `admin` / `admin123`

---

## 🏗️ Arquitectura

| Componente | Stack | Rol |
|---|---|---|
| **Bridge** | Python · paho-mqtt | Lee sensores y publica en MQTT |
| **EMQX** | Docker | Broker MQTT con autenticación |
| **API** | .NET 10 · EF Core · MQTTnet | REST + WebSocket + Alarmas |
| **PostgreSQL** | Docker | Series temporales y configuración |
| **Frontend** | React 19 · Vite 8 · Tailwind 4 | Dashboard con WebSocket |

### Flujo de datos

```
┌──────────┐     MQTT      ┌──────────┐    WebSocket    ┌──────────┐
│  Bridge  │──────────────▶│   API    │────────────────▶│ Frontend │
│          │  history/5min │          │   realtime/2s   │          │
│  Python  │  realtime/2s  │  .NET    │   solo si hay   │  React   │
│          │               │          │   espectadores  │          │
└──────────┘               └────┬─────┘                 └──────────┘
                                │
                          ┌─────┴─────┐
                          │ PostgreSQL│
                          │ Alarmas   │
                          │ Telegram  │
                          │ Email     │
                          └───────────┘
```

---

## 🔐 Seguridad

| Capa | Mecanismo |
|---|---|
| **API ↔ Frontend** | JWT httpOnly cookie · 3 roles (SuperAdmin, Admin, Viewer) |
| **MQTT** | User/password |
| **Datos sensibles** | Email y teléfono enmascarados en API |
| **TLS** | Traefik + Let's Encrypt (cloud) · Sin TLS (intranet) |

### Roles

```
    SuperAdmin ────▶ Admin ────▶ Viewer
       │                │            │
   Todo acceso     CRUD sensores   Solo lectura
   Crear Admins    Crear Viewers   Dashboard
   Eliminar Admins Gestionar       Sin admin
```

---

## 🔔 Alarmas

- **Analógico:** rango mínimo / máximo — notifica si el valor sale fuera del rango
- **Digital estado:** notifica en ON, en OFF, o ambos
- **Digital contador:** notifica si el acumulado sale fuera del rango

> Cooldown de 5 minutos entre notificaciones · Canales: Telegram Bot API + Email (Resend/SMTP)

---

## 🌐 API REST

```
/api/auth/login          POST   Login
/api/auth/me             GET    Perfil propio
/api/auth/users          GET    Lista de usuarios (Admin+)
/api/plantas             GET    Plantas disponibles
/api/areas               GET    Áreas por planta
/api/sensores            GET    Sensores por planta/área
/api/datos               GET    Historial con filtro de fechas
/api/datos?agregar=diario GET   Agregación diaria para contadores
/api/unidades            GET    Unidades de medida
```

[Documentación completa de endpoints →](AGENTS.md)

---

## 📊 WebSocket

```
ws://host:5000/ws/realtime?planta=p1&area=a1
```

- JWT validado antes del upgrade
- START automático al conectar el primer cliente → bridge activa realtime
- STOP automático al desconectar el último → bridge pausa realtime
- Datos **nunca se persisten en DB** — solo fluyen al dashboard

---

## 🎨 Diseño

- **Paleta:** Ámbar industrial (#F59E0B) · Verde militar (#22C55E) · Rojo piloto (#DC2626)
- **Tipografía:** Monospace para datos · Sans-serif para interfaz
- **Profundidad:** Solo capas tonales · Cero sombras · 150ms transiciones
- **Tema:** Oscuro · Alta densidad de información · Legibilidad a distancia de sala de control

[Documentación completa de diseño →](DESIGN.md)

---

## 🔧 Variables de entorno

```bash
# .env
DEPLOYMENT_MODE=intranet
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USER=admin
MQTT_PASS=secret
JWT_SECRET=clave-super-secreta-minimo-32-caracteres
SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD=admin123
SIMULATION=true
PLANTA=p1
AREA=a1
HISTORY_INTERVAL=300    # 5 minutos entre datos de historial
REALTIME_INTERVAL=2     # 2 segundos entre datos de realtime
VITE_API_BASE=http://localhost:5000
```

---

## 🧪 Tests

```bash
# xUnit — 47 tests con InMemory DB
cd api.Tests && dotnet test

# Playwright E2E — headless Chromium
cd /tmp && node frontend-test.js
```

---

## 📁 Estructura

```
monitoreoIndustrial/
├── api/           # .NET 10 Web API
├── api.Tests/     # xUnit (47 tests)
├── bridge/        # Python bridge + simulación
├── frontend/      # React 19 dashboard
├── docker/        # Docker Compose (EMQX + PostgreSQL)
├── openspec/      # Planeación de cambios
├── .env           # Variables de entorno
├── DESIGN.md      # Sistema de diseño
├── PRODUCT.md     # Contexto de producto
└── AGENTS.md      # Documentación de desarrollo
```

---

## 📖 Documentación

- **[AGENTS.md](AGENTS.md)** — Documentación de desarrollo completa: arquitectura, endpoints, stack, comandos, variables
- **[DESIGN.md](DESIGN.md)** — Sistema de diseño: paleta, tipografía, componentes, reglas
- **[PRODUCT.md](PRODUCT.md)** — Contexto de producto: usuarios, propósito, principios
- **[openspec/](openspec/)** — Planeación y seguimiento de cambios

---

<div align="center">

```
╔═══════════════════════════════════════════════════════════╗
║  Construido con .NET 10 · React 19 · Python 3 · Docker    ║
║                                                           ║
║  Licencia: MIT                                            ║
╚═══════════════════════════════════════════════════════════╝
```

</div>
