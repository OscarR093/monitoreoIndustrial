# Sistema de Monitoreo Industrial

Puente bidireccional entre PLCs industriales y broker MQTT, con API REST y WebSocket.

## Arquitectura

```
PLC (real o simulado) → Bridge → MQTT Broker (EMQX) → API (.NET) ↔ WebSocket ↔ Frontend
```

## Componentes

| Componente | Descripción |
|------------|-------------|
| **Bridge** | Script Python que lee datos del PLC y los publica en MQTT |
| **EMQX** | Broker MQTT (Docker) |
| **PostgreSQL** | Base de datos (Docker) |
| **API (.NET 10)** | REST API + WebSocket |
| **Frontend** | React (temporal, descartable) |

## Inicio Rápido

```bash
# 1. Iniciar servicios externos
cd docker && docker compose up -d

# 2. Instalar dependencias bridge
pip install -r bridge/requirements.txt

# 3. Iniciar API (terminal 1)
cd api && dotnet run

# 4. Iniciar bridge (terminal 2)
python bridge/main.py

# 5. Frontend desarrollo (terminal 3) - opcional
cd frontend && npm run dev
```

## Puertos

| Servicio | Puerto |
|----------|--------|
| API | 5000 |
| EMQX MQTT | 1883 |
| EMQX Dashboard | 18083 |
| PostgreSQL | 5432 |
| Frontend | 3000 |

## Topics MQTT

| Topic | Descripción |
|-------|-------------|
| `industrial/{planta}/{area}/history` | Datos históricos (cada 20 min) |
| `industrial/{planta}/{area}/realtime` | Datos tiempo real (si START) |
| `industrial/{planta}/{area}/control` | Comandos START/STOP |

## API REST

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/plantas` | Listar plantas |
| GET | `/api/areas` | Listar áreas (filtro: planta) |
| GET | `/api/sensores` | Listar sensores (filtros: planta, area) |
| POST | `/api/sensores` | Crear sensor |
| PUT | `/api/sensores/{id}` | Actualizar sensor |
| DELETE | `/api/sensores/{id}` | Eliminar sensor |
| GET | `/api/datos` | Datos históricos (filtros: planta, area, limit) |
| GET | `/api/tipos-grafico` | Listar tipos de gráfico |
| GET | `/api/unidades` | Listar unidades |

## WebSocket

- **Endpoint**: `ws://localhost:5000/ws/realtime?planta=p1&area=a1`
- Conectar → publica "START" en topic control
- Desconectar → publica "STOP"
- Recibe datos realtime del bridge

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

## Documentación

- [AGENTS.md](AGENTS.md) - Documentación de desarrollo detallada

## Estado

**Demo funcional con:**
- API REST completa
- WebSocket con control START/STOP
- Suscriptor MQTT
- Frontend demo básico
- Bridge con simulación

**Pendiente para siguientes iteraciones:**
- Mejorar bridge (robustez, reconexión)
- Completar API (validaciones, seguridad)
- Construir frontend real de la plataforma