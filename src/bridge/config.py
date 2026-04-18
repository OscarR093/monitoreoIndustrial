"""
Modulo de configuracion del bridge industrial.

Carga variables de entorno desde archivo .env para configurar la conexion MQTT,
los parametros de ejecucion del sistema de monitoreo y la conexion al PLC.

Variables de entorno requeridas:
    MQTT_BROKER: direccion del broker MQTT (default: localhost)
    MQTT_PORT: puerto plain MQTT 1883 (default: 1883)
    MQTTS_PORT: puerto TLS MQTT 8883 (default: 8883)
    REAL_TIME_INTERVAL: intervalo de publicacion tiempo real en segundos (default: 2)
    HISTORIC_INTERVAL: intervalo de publicacion historico en segundos (default: 1200 = 20 min)
    PLANTA: identificador de la planta (default: p1)
    AREAS: lista de areas separadas por coma (default: a1)
    SENSOR_COUNT: cantidad de sensores por area (default: 4)
    SIMULATION: modo simulacion (true) o conexion PLC real (false) (default: true)
    PLC_HOST: direccion IP del PLC (default: 192.168.1.100)
    PLC_PORT: puerto de comunicacion Modbus (default: 502)
    PLC_UNIT_ID: ID de unidad Modbus del PLC (default: 1)

Autor: Sistema Monitoreo Industrial
Fecha creacion: 2026-04-18
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Configuracion MQTT - broker y puertos
MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
MQTTS_PORT = int(os.getenv("MQTTS_PORT", 8883))

# Intervalos de publicacion de datos
REAL_TIME_INTERVAL = int(os.getenv("REAL_TIME_INTERVAL", 2))
HISTORIC_INTERVAL = int(os.getenv("HISTORIC_INTERVAL", 1200))

# Identificadores de planta y areas
PLANTA = os.getenv("PLANTA", "p1")
AREAS = os.getenv("AREAS", "a1").split(",")

# Cantidad de sensores por area
SENSOR_COUNT = int(os.getenv("SENSOR_COUNT", 4))

# Modo de operacion: true=simulacion, false=PLC real
SIMULATION = os.getenv("SIMULATION", "true").lower() == "true"

# Configuracion del PLC real (utilizado cuando SIMULATION=false)
PLC_HOST = os.getenv("PLC_HOST", "192.168.1.100")
PLC_PORT = int(os.getenv("PLC_PORT", 502))
PLC_UNIT_ID = int(os.getenv("PLC_UNIT_ID", 1))


def get_config():
    """
    Retorna diccionario con toda la configuracion del bridge.

    Returns:
        dict: Diccionario con todas las configuraciones.
    """
    return {
        "mqtt_broker": MQTT_BROKER,
        "mqtt_port": MQTT_PORT,
        "mqtts_port": MQTTS_PORT,
        "real_time_interval": REAL_TIME_INTERVAL,
        "historic_interval": HISTORIC_INTERVAL,
        "planta": PLANTA,
        "areas": AREAS,
        "sensor_count": SENSOR_COUNT,
        "simulation": SIMULATION,
        "plc_host": PLC_HOST,
        "plc_port": PLC_PORT,
        "plc_unit_id": PLC_UNIT_ID,
    }
