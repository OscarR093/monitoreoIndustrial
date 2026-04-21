# Sistema de Monitoreo Industrial - Documentación de Desarrollo

## Fecha: 2026-04-21

## Context7

Always use context7 when I need library/API documentation, code generation, 
setup or configuration steps without me having to explicitly ask.

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

---

## Estructura del Proyecto

```
monitoreoIndustrial/
├── docker/
│   └── docker-compose.yml    # EMQX + PostgreSQL
├── api/                       # .NET Core Web API (.NET 10)
│   ├── Models/
│   │   ├── Planta.cs
│   │   ├── Area.cs
│   │   ├── TipoGrafico.cs
│   │   ├── Unidad.cs
│   │   ├── Sensor.cs
│   │   └── DatoSensor.cs
│   ├── Data/
│   │   └── AppDbContext.cs
│   ├── Controllers/
│   │   ├── PlantasController.cs
│   │   ├── AreasController.cs
│   │   ├── SensoresController.cs
│   │   ├── DatosController.cs
│   │   ├── TiposGraficoController.cs
│   │   ├── UnidadesController.cs
│   │   └── WebSocketController.cs
│   ├── Services/
│   │   ├── MqttSubscriberService.cs
│   │   └── WebSocketRealtimeService.cs
│   ├── Migrations/
│   └── api.csproj
├── bridge/                    # Python bridge
├── frontend/                  # React frontend (temporal, descartable)
├── next_steps.md
└── AGENTS.md
```

---

## Configuración

### Variables de Entorno (.env)

| Variable | Default | Descripción |
|----------|---------|-------------|
| MQTT_BROKER | localhost | Broker MQTT |
| MQTT_PORT | 1883 | Puerto plain |
| PLC_HOST | 192.168.1.100 | IP del PLC |
| PLC_PORT | 502 | Puerto Modbus TCP |
| PLC_UNIT_ID | 1 | ID unidad Modbus |
| PLANTA | p1 | Identificador de planta |
| AREA | a1 | Identificador de área |
| HISTORY_INTERVAL | 1200 | Intervalo histórico (1200s = 20 min) |
| REALTIME_INTERVAL | 2 | Intervalo realtime (2s) |
| SIMULATION | true | Usar simulación en vez de PLC real |

### Topics MQTT

- **History**: `industrial/{planta}/{area}/history`
- **Realtime**: `industrial/{planta}/{area}/realtime`
- **Control**: `industrial/{planta}/{area}/control`

### Comandos de Control

- `START`: Activa publicación realtime desde el bridge
- `STOP`: Desactiva publicación realtime

---

## Módulos del Bridge

### config.py
Carga variables de entorno.

### sensors.py
Define los sensores del sistema.

### plc_connection.py
Conexión al PLC real via pymodbus.

### plc_simulation.py
Simula datos del PLC para desarrollo.

### mqtt_client.py
Cliente MQTT con publicación y suscripción.

### threads.py
Hilos separados para publicación simultánea.

### main.py
Orquestador principal del bridge.

### control_client.py
Cliente para enviar comandos START/STOP.

### test_client.py
Suscriptor de pruebas.

---

## Ejecución

### Iniciar EMQX y PostgreSQL
```bash
cd docker
docker compose up -d
```

### Iniciar API
```bash
cd api && dotnet run
```

### Iniciar Bridge
```bash
python bridge/main.py
```

### Iniciar Frontend (descartable)
```bash
cd frontend && npm run dev
```

---

## Formato de Datos

### JSONPublicado en Topics

```json
[
    {
        "sensor": "s1",
        "valor": 123.45,
        "timestamp": 1713500000.0
    },
    {
        "sensor": "s2",
        "valor": 124.67,
        "timestamp": 1713500000.0
    }
]
```

---

## API (.NET Core 10)

### Stack

- .NET 10 (Web API)
- PostgreSQL (Entity Framework Core)
- MQTTnet 5.x (suscriptor MQTT)
- System.Net.WebSockets

### Endpoints REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/plantas` | Listar plantas |
| GET | `/api/areas` | Listar áreas (filtro: planta) |
| GET | `/api/sensores` | Listar sensores (filtros: planta, area) |
| POST | `/api/sensores` | Crear sensor |
| PUT | `/api/sensores/{id}` | Actualizar sensor |
| DELETE | `/api/sensores/{id}` | Eliminar sensor |
| GET | `/api/datos` | Datos históricos (filtros: planta, area, limit) |
| POST | `/api/datos` | Crear dato |
| GET | `/api/tipos-grafico` | Listar tipos de gráfico |
| GET | `/api/unidades` | Listar unidades |

### WebSocket

- **Endpoint**: `ws://host:5000/ws/realtime?planta=p1&area=a1`
- **Control automático**: Al conectar publica START, al desconectar STOP
- **Forward**: Datos realtime del bridge al cliente

### Servicios

#### MqttSubscriberService
- Suscrito a `industrial/+/+/history` y `industrial/+/+/realtime`
- Guarda datos en PostgreSQL
- Auto-crea sensores nuevos si no existen

#### WebSocketRealtimeService
- Mantiene conexiones WebSocket por planta/área
- Publica START/STOP en topics de control
- Reenvía datos realtime a clientes conectados

---

## Base de Datos

### Tablas

```sql
-- Plantas
CREATE TABLE plantas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    codigo VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Áreas
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    planta_id INT REFERENCES plantas(id),
    nombre VARCHAR(100),
    codigo VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tipos de Gráfico
CREATE TABLE tipos_graficos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    descripcion VARCHAR(200),
    widget VARCHAR(50)
);

-- Unidades
CREATE TABLE unidades (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50),
    simbolo VARCHAR(20),
    descripcion VARCHAR(200)
);

-- Sensores
CREATE TABLE sensores (
    id SERIAL PRIMARY KEY,
    area_id INT REFERENCES areas(id),
    sensor_id VARCHAR(20),
    registro INT,
    nombre VARCHAR(100),
    tipo_grafico_id INT REFERENCES tipos_graficos(id),
    unidad_id INT REFERENCES unidades(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Datos de Sensores
CREATE TABLE datos_sensores (
    id SERIAL PRIMARY KEY,
    sensor_id INT REFERENCES sensores(id),
    valor DECIMAL(10,2),
    timestamp BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Datos Iniciales

**Plantas:**
- Planta 1 (codigo: p1)

**Áreas:**
- Área 1 (codigo: a1) → planta p1

**TipoGráficos:**
- línea (Time Series) → widget: line
- gauge (Indicador) → widget: gauge
- bar (Barras) → widget: bar

**Unidades:**
- Temperatura (°C), Presión (PSI), Voltaje (V), Corriente (A), Porcentaje (%), RPM

---

## Estado del Sistema (2026-04-21)

### Completado

- [x] API .NET Core 10 funcional
- [x] PostgreSQL con Entity Framework
- [x] MqttSubscriberService
- [x] WebSocket con control START/STOP
- [x] Endpoints REST completos
- [x] Frontend demo (temporal, descartable)

### Pendiente ( próximos pasos)

- [ ] Mejorar bridge (robustez, manejo de errores, reconexión)
- [ ] Completar API (validaciones, seguridad)
- [ ] Construir frontend real de la plataforma

---

## Comandos Útiles

```bash
# Compilar API
export PATH="$PATH:/home/oscarr093/.dotnet" && cd api && dotnet build

# Ejecutar API
export PATH="$PATH:/home/oscarr093/.dotnet" && cd api && dotnet run

# Ver logs de la API
tail -f /tmp/api.log

# Ver logs del bridge
tail -f /tmp/bridge.log

# Crear migración
export PATH="$PATH:/home/oscarr093/.dotnet:/home/oscarr093/.dotnet/tools" && cd api && dotnet ef migrations add Nombre

# Aplicar migración
export PATH="$PATH:/home/oscarr093/.dotnet:/home/oscarr093/.dotnet/tools" && cd api && dotnet ef database update
```

---

## Autores

Sistema Monitoreo Industrial - 2026-04-21