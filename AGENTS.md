# Sistema de Monitoreo Industrial - Documentación de Desarrollo

## Fecha: 2026-04-19

## Arquitectura del Sistema

```
PLC (real o simulado) → Bridge → MQTT Broker (EMQX) → Suscriptores (API)
```

### Flujo de Datos

1. **Bridge** lee datos del PLC (real via Modbus TCP o simulado)
2. **Bridge** publica en topics MQTT:
   - `industrial/{planta}/{area}/history` - datos históricos (cada 20 min)
   - `industrial/{planta}/{area}/realtime` - datos en tiempo real (cada 2s, si START)
3. **Suscriptores** reciben datos de topics history/realtime
4. **Control** envía comandos START/STOP al topic control

---

## Estructura del Proyecto

```
monitoreoIndustrial/
├── docker/
│   └── docker-compose.yml    # EMQX broker
├── bridge/
│   ├── .env                 # Variables de entorno
│   ├── config.py            # Carga configuración
│   ├── sensors.py           # Lista sensores
│   ├── plc_connection.py   # Conexión PLC real (Modbus TCP)
│   ├── plc_simulation.py  # Simulación valores
│   ├── mqtt_client.py     # Cliente MQTT
│   ├── threads.py         # Hilos history y realtime
│   ├── main.py           # Punto de entrada
│   ├── control_client.py # Enviador comandos START/STOP
│   ├── test_client.py   # Suscriptor de pruebas
│   ├── requirements.txt # Dependencias
│   └── README.md      # Documentación bridge
├── README.md         # Overview del proyecto
└── AGENTS.md        # Este archivo
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

- `START`: Activa publicación realtime
- `STOP`: Desactiva publicación realtime

---

## Módulos del Bridge

### config.py
Carga variables de entorno.

**Funciones:**
- `get_config()` - retorna diccionario de configuración
- `get_topics()` - retorna diccionario de topics
- `get_topics_from_params(planta, area)` - retorna topics para planta/área específicos

### sensors.py
Define los sensores del sistema.

**Estructura:**
```python
SENSORES = [
    {"id": "s1", "registro": 0},
    {"id": "s2", "registro": 1},
    {"id": "s3", "registro": 2},
    {"id": "s4", "registro": 3},
]
```

**Funciones:**
- `get_sensores()` - retorna lista de sensores
- `get_sensor_ids()` - retorna solo ids de sensores
- `get_sensores_list()` - retorna tuplas (id, registro)

### plc_connection.py
Conexión al PLC real via pymodbus.

**Clases:**
- `PLCConnection` - cliente Modbus TCP

**Métodos:**
- `conectar()` - establece conexión
- `desconectar()` - cierra conexión
- `leer_datos()` - lee registros y retorna lista de datos

### plc_simulation.py
Simula datos del PLC para desarrollo.

**Clases:**
- `PLCSimulation` - genera valores aleatorios 100-200

**Características:**
- Valores aleatorios entre 100 y 200
- Variación aleatoria de ±2 por lectura
- Timestamp Unix

### mqtt_client.py
Cliente MQTT con publicación y suscripción.

**Clases:**
- `MQTTClient` - wrapper de paho-mqtt

**Métodos:**
- `conectar()` - conecta al broker
- `desconectar()` - desconecta
- `suscribir(topic)` - suscribe a topic
- `publicar(topic, payload)` - publicaJSON

### threads.py
Hilos separados para publicación simultánea.

**Clases:**
- `HiloHistory` - publicación periódica (siempre activo)
- `HiloRealTime` - publicación rápida (activable con START/STOP)

**Características:**
- Hilos daemon
- No bloquean entre sí
- Intervalos configurables

### main.py
Orquestador principal del bridge.

**Flujo:**
1. Cargar configuración
2. Crear PLC (simulación o real)
3. Conectar a MQTT
4. Suscribirse a topic control
5. Iniciar hilos
6. procesar comandos START/STOP
7. Mantener proceso vivo

---

## Ejecución

### Iniciar EMQX
```bash
cd docker
docker compose up -d
```

### Iniciar Bridge
```bash
# Modo desarrollo (simulación)
python bridge/main.py

# Modo producción (PLC real)
SIMULATION=false python bridge/main.py

# Intervalos personalizados
HISTORY_INTERVAL=300 REALTIME_INTERVAL=1 python bridge/main.py

# Para otra área
AREA=a2 python bridge/main.py
```

### Controlar Publicación Realtime
```bash
# Activar realtime
python bridge/control_client.py START

# Desactivar realtime
python bridge/control_client.py STOP

# Para otra área
AREA=a2 python bridge/control_client.py START
```

### Observar Datos
```bash
# Suscribirse a history y realtime
python bridge/test_client.py
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

## Pruebas Realizadas

1. ✅ Bridge iniciado correctamente
2. ✅ Conexión a MQTT establecida
3. ✅ Suscripción a topic control
4. ✅ Publicación history cada X segundos
5. ✅ Control START activa realtime
6. ✅ Publicación realtime cada X segundos
7. ✅ Control STOP desactiva realtime
8. ✅ Datos con sensor, valor y timestamp
9. ✅ Hilos simultáneos no bloqueantes
10. ✅ Múltiples instancias para diferentes áreas

---

## Notas para Desarrollo Futuro

1. **PLC Real**: Configurar PLC_HOST, PLC_PORT, PLC_UNIT_ID en .env
2. **Múltiples Áreas**: Ejecutar instancia separada del script por área
3. **Agregar Sensores**: Editar sensors.py, agregar al数组 SENSORES
4. **Seguridad**: Configurar MQTT TLS para producción
5. **Logs**: Implementar rotación de logs
6. **Autenticación MQTT**: Agregar usuario/contraseña

---

## Dependencias

```
paho-mqtt>=1.6.1
python-dotenv>=1.0.0
pymodbus>=3.0.0  # Solo para producción
```

---

## Autores

Sistema Monitoreo Industrial - 2026-04-19