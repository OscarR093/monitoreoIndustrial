# Bridge PLC → MQTT

Puente bidireccional que lee datos de un PLC industrial y los publica en un broker MQTT.

## Arquitectura

```
┌─────────┐     ┌─────────┐     ┌─────────────┐
│   PLC   │ ──► │ Bridge  │ ──► │ MQTT (EMQX) │
│ Real or │     │ Python  │     │   Broker   │
│Simulation     │ Threads │     │             │
└─────────┘     └─────────┘     └─────────────┘
```

## Flujo de Datos

1. **Bridge** lee datos del PLC (Modbus TCP o simulación)
2. **Publica** en topics MQTT:
   - `industrial/{planta}/{area}/history` - cada HISTORY_INTERVAL
   - `industrial/{planta}/{area}/realtime` - cada REALTIME_INTERVAL (si START)
3. **Recibe** comandos en `industrial/{planta}/{area}/control`:
   - `START` - activa publicación realtime
   - `STOP` - desactiva publicación realtime

---

## Estructura de Archivos

```
bridge/
├── .env                 # Variables de entorno
├── config.py            # Carga configuración
├── sensors.py           # Lista de sensores (id, registro Modbus)
├── plc_connection.py   # Conexión PLC real (Modbus TCP)
├── plc_simulation.py    # Simulación de valores
├── mqtt_client.py       # Cliente MQTT
├── threads.py          # Hilos history y realtime
├── main.py             # Punto de entrada
├── control_client.py   # Enviador de comandos START/STOP
├── test_client.py       # Suscriptor de pruebas
└── requirements.txt   # Dependencias Python
```

---

## Instalación

```bash
# Instalar dependencias
pip install -r requirements.txt
```

---

## Configuración

### Variables de Entorno (.env)

| Variable | Default | Descripción |
|----------|---------|-------------|
| `MQTT_BROKER` | localhost | Host del broker MQTT |
| `MQTT_PORT` | 1883 | Puerto MQTT |
| `PLC_HOST` | 192.168.1.100 | IP del PLC |
| `PLC_PORT` | 502 | Puerto Modbus TCP |
| `PLC_UNIT_ID` | 1 | ID unidad Modbus |
| `PLANTA` | p1 | Identificador de planta |
| `AREA` | a1 | Identificador de área |
| `HISTORY_INTERVAL` | 1200 | Segundos entre publicaciones history (20 min) |
| `REALTIME_INTERVAL` | 2 | Segundos entre publicaciones realtime |
| `SIMULATION` | true | Usar simulación en lugar de PLC real |

### Topics MQTT

| Topic | Tipo | Descripción |
|-------|------|-------------|
| `industrial/{p}/{a}/history` | Publicar | Datos históricos |
| `industrial/{p}/{a}/realtime` | Publicar | Datos tiempo real |
| `industrial/{p}/{a}/control` | Suscribir | Comandos START/STOP |

### Comandos de Control

| Comando | Acción |
|---------|--------|
| `START` | Activa publicación en topic realtime |
| `STOP` | Desactiva publicación en topic realtime |

---

## Sensores

### Definir Sensores

Editar `sensors.py`:

```python
SENSORES = [
    {"id": "s1", "registro": 0},
    {"id": "s2", "registro": 1},
    {"id": "s3", "registro": 2},
    {"id": "s4", "registro": 3},
]
```

Cada sensor tiene:
- `id`: Identificador único (s1, s2, ...)
- `registro`: Dirección del registro Modbus

---

## Uso

### Iniciar Bridge

```bash
# Modo desarrollo (simulación)
python main.py

# Modo producción (PLC real)
SIMULATION=false python main.py

# Intervalos personalizados
HISTORY_INTERVAL=60 REALTIME_INTERVAL=1 python main.py

# Para otra área
AREA=a2 python main.py
```

### Controlar Publicación

```bash
# Activar realtime
python control_client.py START

# Desactivar realtime
python control_client.py STOP

# Para planta/área diferente
PLANTA=p2 AREA=a3 python control_client.py START
```

### Observar Datos

```bash
# Suscribirse a topics
python test_client.py
```

### Ejecutar Múltiples Instancias

```bash
# Área a1
python main.py

# Área a2 (otra terminal)
AREA=a2 python main.py

# Área a3 (otra terminal)
AREA=a3 python main.py
```

---

## Módulos

### config.py

Carga variables de entorno y genera topics.

```python
from config import get_config, get_topics

config = get_config()
topics = get_topics()

print(config["area"])          # a1
print(topics["history"])      # industrial/p1/a1/history
```

### sensors.py

Lista centralizada de sensores.

```python
from sensors import get_sensores, get_sensores_list

sensores = get_sensores()
# [{"id": "s1", "registro": 0}, ...]

sensores_list = get_sensores_list()
# [("s1", 0), ("s2", 1), ...]
```

### plc_connection.py

Conexión a PLC real via Modbus TCP.

```python
from plc_connection import PLCConnection
from config import get_config

config = get_config()
plc = PLCConnection(config["plc_host"], config["plc_port"])

plc.conectar()
datos = plc.leer_datos()
plc.desconectar()
```

### plc_simulation.py

Simulación de datos para desarrollo.

```python
from plc_simulation import PLCSimulation

plc = PLCSimulation()
plc.iniciar()
datos = plc.leer_datos()
```

### mqtt_client.py

Cliente MQTT con publicación y suscripción.

```python
from mqtt_client import MQTTClient

def on_message(topic, payload):
    print(f"{topic}: {payload}")

mqtt = MQTTClient("localhost", 1883, on_message)
mqtt.conectar()
mqtt.suscribir("industrial/p1/a1/control")
mqtt.publicar("industrial/p1/a1/history", [{"sensor": "s1", "valor": 123, "timestamp": 1234567890}])
```

### threads.py

Hilos separados para publicación simultánea.

```python
from threads import HiloHistory, HiloRealTime

history = HiloHistory(1200, mqtt, topic_history, plc)
realtime = HiloRealTime(2, mqtt, topic_realtime, plc)

history.start()
realtime.start()

realtime.habilitar()  # START
realtime.deshabilitar()  # STOP
```

---

## Formato de Datos

### JSON publicado

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

### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sensor` | string | ID del sensor (s1, s2, ...) |
| `valor` | float | Valor de la medición |
| `timestamp` | float | Timestamp Unix |

---

## Dependencias

```
paho-mqtt>=1.6.1
python-dotenv>=1.0.0
pymodbus>=3.0.0
```

---

## Troubleshooting

### No conecta al broker MQTT

```bash
# Verificar que EMQX esté corriendo
docker ps

# Probar conexión
python -c "from mqtt_client import obtener_mqtt; print(obtener_mqtt({'mqtt_broker': 'localhost', 'mqtt_port': 1883}).conectar())"
```

### No recibe comandos START/STOP

```bash
# Verificar suscripción
mosquitto_sub -t "industrial/p1/a1/control" -v

# Enviar comando manualmente
mosquitto_pub -t "industrial/p1/a1/control" -m "START"
```

### No publica datos

```bash
# Ver topics activos
mosquitto_sub -t "industrial/p1/a1/#" -v

# Reducir intervalos para pruebas
HISTORY_INTERVAL=5 REALTIME_INTERVAL=1 python main.py
```

---

## Ejemplo de Integración con API

```python
import paho.mqtt.client as mqtt
import json

def on_message(client, userdata, msg):
    datos = json.loads(msg.payload)
    print(f"Recibidos {len(datos)} lecturas")
    for d in datos:
        print(f"  {d['sensor']}: {d['valor']}")

client = mqtt.Client()
client.on_message = on_message
client.connect("localhost", 1883, 60)
client.subscribe("industrial/p1/a1/#")
client.loop_forever()
```

---

## Autores

Sistema Monitoreo Industrial - 2026-04-19