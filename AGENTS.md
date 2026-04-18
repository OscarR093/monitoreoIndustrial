# Sistema de Monitoreo Industrial - Documentación de Sesión

## Fecha: 2026-04-18

## Arquitectura del Sistema

El sistema de monitoreo industrial sigue una arquitectura de 3 capas:

```
PLC (real o simulado) → Bridge → MQTT Broker (EMQX) → Suscriptores (API)
```

### Componentes creados

1. **Broker MQTT**: Docker EMQX (puertos 1883/8883)
2. **Bridge**: Script Python con hilos separados
3. **Capa de datos**: Sensores con definiciones centralizadas
4. **Modo desarrollo**: SimulacionPLC
5. **Modo produccion**: ConexionPLC (placeholder para PLC real)

---

## Estructura del Proyecto

```
monitoreoIndustrial/
├── docker/
│   └── docker-compose.yml    # EMQX broker
├── src/bridge/
│   ├── config.py           # Configuracion y variables de entorno
│   ├── sensores.py        # Definiciones de sensores
│   ├── plc_simulacion.py  # Simulador de datos (desarrollo)
│   ├── plc_conexion.py   # Conexion PLC real (produccion)
│   ├── mqtt.py          # Cliente MQTT
│   ├── hilos.py         # Hilos historico y realtime
│   └── main.py        # Punto de entrada
├── .env                 # Variables de entorno
├── .env.example       # Plantilla de variables
└── requirements.txt   # Dependencias Python
```

---

## Configuración

### Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| MQTT_BROKER | localhost | Broker MQTT |
| MQTT_PORT | 1883 | Puerto plain |
| MQTTS_PORT | 8883 | Puerto TLS |
| REAL_TIME_INTERVAL | 2 | Intervalo realtime (segundos) |
| HISTORIC_INTERVAL | 1200 | Intervalo historico (1200s = 20min) |
| PLANTA | p1 | Identificador de planta |
| AREAS | a1 | Areas (comma-separated) |
| SENSOR_COUNT | 4 | Sensores por area |
| SIMULATION | true | Modo simulacion |
| PLC_HOST | 192.168.1.100 | IP del PLC |
| PLC_PORT | 502 | Puerto Modbus |
| PLC_UNIT_ID | 1 | ID unidad Modbus |

### Topics MQTT

- Datos sensores: `industrial/{planta}/{area}/sensores`
- Control área: `industrial/{planta}/{area}/control`
- Control general: `industrial/{planta}/control`

### Comandos de Control

- `START`: Activa modo tiempo real
- `STOP`: Desactiva modo tiempo real

---

## Modulos del Bridge

### config.py
Carga variables de entorno y provee configuración centralizada.

**Funciones:**
- `get_config()`: Retorna diccionario con toda la configuración

### sensores.py
Define los sensores del sistema en una lista centralizada.

**Estructura:**
```python
SENSORES = [
    {"id": "s1", "nombre": "Temperatura", "area": "a1", "planta": "p1"},
    {"id": "s2", "nombre": "Presion", "area": "a1", "planta": "p1"},
    {"id": "s3", "nombre": "Flujo", "area": "a1", "planta": "p1"},
    {"id": "s4", "nombre": "Nivel", "area": "a1", "planta": "p1"},
]
```

**Funciones:**
- `get_sensores_by_area(area, planta)`: Sensores por área
- `get_sensores_by_planta(planta)`: Sensores por planta
- `get_sensor_by_id(sensor_id)`: Sensor por ID

### plc_simulacion.py
Simula datos del PLC para desarrollo.

**Clases:**
- `SensorSimulado`: Sensor con valores incrementales (100-200)
- `PLCBridge`: Puente de simulación

**Características:**
- Valores incrementales entre 100 y 200
- Variación aleatoria de ±2
- Timestamp Unix

### plc_conexion.py
Conexión al PLC real via pymodbus.

**Clases:**
- `PLCBridge`: Puente Modbus TCP

**Requisitos:**
- PLC accesible via Modbus TCP
- pip install pymodbus

### mqtt.py
Cliente MQTT con suscripción a topics de control.

**Clases:**
- `MQTTClient`: Cliente paho-mqtt

**Características:**
- Conexión al broker
- Suscripción a control por área y general
- Callback para START/STOP

### hilos.py
Hilos separados para publicación simultánea.

**Clases:**
- `HiloHistorico`: Publicación periódica (siempre activo)
- `HiloRealTime`: Publicación rápida (activable)

**Características:**
- Hilos daemon
- No bloquean entre sí
- Configurables via intervalos

### main.py
Orquestador principal del bridge.

**Flujo:**
1. Cargar configuración
2. Crear PLC (simulación o real)
3. Conectar a MQTT
4. Iniciar hilos
5. Mantener proceso vivo

---

## Ejecución

### Iniciar EMQX
```bash
cd docker
docker compose up -d
```

### Iniciar Bridge
```bash
# Con un área
python src/bridge/main.py

# Con dos áreas (instancia separada)
AREAS=a1 python src/bridge/main.py

# Modo producción
SIMULATION=false python src/bridge/main.py

# Con intervalos personalizados
REAL_TIME_INTERVAL=1 HISTORIC_INTERVAL=300 python src/bridge/main.py
```

### Enviar control
```bash
# Activar realtime
mosquitto_pub -t "industrial/p1/a1/control" -m "START"

# Desactivar realtime
mosquitto_pub -t "industrial/p1/a1/control" -m "STOP"

# Control general (todas las áreas)
mosquitto_pub -t "industrial/p1/control" -m "START"
```

---

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

---

## Pruebas Realizadas

1. ✅ Bridge iniciado correctamente
2. ✅ Publicación histórica (20 min)
3. ✅ Control START activa realtime
4. ✅ Publicación realtime (2s)
5. ✅ Control STOP desactiva realtime
6. ✅ Datos con nombre de sensor
7. ✅ Hilos simultáneos no bloqueantes

---

## Notas para Desarrollo Futuro

1. **PLC Real**: Cuando llegue el PLC, configurar PLC_HOST, PLC_PORT, PLC_UNIT_ID
2. **Múltiples Áreas**: Ejecutar instancia separadas del script
3. **Persistencia**: Agregar base de datos cuando llegue la capa API
4. **Seguridad**: Configurar MQTT TLS para producción
5. **Logs**: Implementar rotación de logs

---

## Dependencias

```
paho-mqtt>=1.6.1
python-dotenv>=1.0.0
pymodbus>=3.0.0  # Solo para producción
```

---

## Comandos de Git

### Commit

Cuando el usuario escriba "commit", crear un commit con los cambios realizados.

```bash
# Ver estado
git status

# Ver cambios
git diff --stat

# Commit con mensaje automático
git add -A
git commit -m "<descripcion del trabajo>"
```

---

## Autores

Sistema Monitoreo Industrial - 2026-04-18