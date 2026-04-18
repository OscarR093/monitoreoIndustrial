# Bridge Industrial

Módulo Python que acts como puente entre el PLC (real o simulado) y el broker MQTT.

## Arquitectura

```
PLC (real o simulado) → Bridge → MQTT Broker (EMQX) → Suscriptores
```

## Estructura de Archivos

```
src/bridge/
├── config.py         # Configuración desde variables de entorno
├── sensores.py      # Definiciones de sensores
├── plc_simulacion.py # Simulador de datos (desarrollo)
├── plc_conexion.py  # Conexión al PLC real (producción)
├── mqtt.py        # Cliente MQTT
├── hilos.py       # Hilos de publicación
└── main.py       # Punto de entrada
```

## Requisitos

- Python 3.11+
- paho-mqtt>=1.6.1
- python-dotenv>=1.0.0
- pymodbus>=3.0.0 (solo para producción)

## Instalación

```bash
pip install -r requirements.txt
```

## Configuración

Crear archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

### Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| MQTT_BROKER | localhost | Broker MQTT |
| MQTT_PORT | 1883 | Puerto plain |
| MQTTS_PORT | 8883 | Puerto TLS |
| REAL_TIME_INTERVAL | 2 | Intervalo realtime (segundos) |
| HISTORIC_INTERVAL | 1200 | Intervalo histórico (20 min) |
| PLANTA | p1 | Identificador de planta |
| AREAS | a1 | Áreas (comma-separated) |
| SIMULATION | true | Modo simulación |
| PLC_HOST | 192.168.1.100 | IP del PLC |
| PLC_PORT | 502 | Puerto Modbus |
| PLC_UNIT_ID | 1 | ID unidad Modbus |

## Uso

### Modo Desarrollo (Simulación)

```bash
python main.py
```

### Modo Producción (PLC Real)

```bash
SIMULATION=false python main.py
```

### Control

Enviar comandos via MQTT:

```bash
# Activar tiempo real
mosquitto_pub -t "industrial/p1/a1/control" -m "START"

# Desactivar tiempo real
mosquitto_pub -t "industrial/p1/a1/control" -m "STOP"

# Control general (todas las áreas)
mosquitto_pub -t "industrial/p1/control" -m "START"
```

## Sensores

Los sensores se definen en `sensores.py`:

```python
SENSORES = [
    {"id": "s1", "nombre": "Temperatura", "area": "a1", "planta": "p1"},
    {"id": "s2", "nombre": "Presion", "area": "a1", "planta": "p1"},
    {"id": "s3", "nombre": "Flujo", "area": "a1", "planta": "p1"},
    {"id": "s4", "nombre": "Nivel", "area": "a1", "planta": "p1"},
]
```

## Módulos

### config.py
Carga variables de entorno y provee configuración centralizada.

### sensores.py
Define los sensores del sistema. Agregar nuevos sensores aquí.

### plc_simulacion.py
Genera datos incrementales (100-200) para desarrollo.

### plc_conexion.py
Conexión al PLC real via Modbus TCP. Usar cuando SIMULATION=false.

### mqtt.py
Cliente MQTT con suscripción a topics de control.

### hilos.py
- HiloHistorico: publicación periódica (siempre activo)
- HiloRealTime: publicación rápida (activable con START)

### main.py
Orquestador principal del bridge.

## Formato de Datos

```json
{
    "area": "a1",
    "planta": "p1",
    "sensor": "s1",
    "nombre": "Temperatura",
    "valor": 123.45,
    "timestamp": 1776544776.69
}
```

## Topics MQTT

- Datos: `industrial/{planta}/{area}/sensores`
- Control área: `industrial/{planta}/{area}/control`
- Control general: `industrial/{planta}/control`

## Logs

Los logs se guardan en `/tmp/bridge.log`.

## Autor

Sistema Monitoreo Industrial - 2026-04-18