"""
Punto de entrada principal del bridge industrial.

Inicializa y coordina todos los componentes del sistema:
    - Configuracion desde variables de entorno
    - Sensores desde sensores.py
    - PLCBridge (simulacion o conexion real)
    - Cliente MQTT para EMQX
    - Hilos de publicacion historica y tiempo real

Arquitectura del sistema:
    PLC (real o simulado) -> Bridge -> MQTT Broker (EMQX) -> Suscriptores

Modo de operacion (variable SIMULATION):
    - SIMULATION=true: usa plc_simulacion.py (desarrollo)
    - SIMULATION=false: usa plc_conexion.py (produccion)

El bridge corre como proceso independiente:
    - Cada instancia maneja una o mas areas (configurable via AREAS)
    - Para multiples areas, correr instancias separadas del script

Topics MQTT:
    - industrial/{planta}/{area}/sensores - datos de sensores
    - industrial/{planta}/{area}/control - control por area
    - industrial/{planta}/control - control general (todas las areas)

Comandos de control:
    - START: activa modo tiempo real
    - STOP: desactiva modo tiempo real

Ejemplo de ejecucion:
    # Modo simulacion (desarrollo)
    SIMULATION=true python main.py

    # Modo produccion (PLC real)
    SIMULATION=false PLC_HOST=192.168.1.100 python main.py

    # Multiple areas
    AREAS=a1,a2 python main.py

Autor: Sistema Monitoreo Industrial
Fecha creacion: 2026-04-18
"""

import time
from config import get_config
from sensores import SENSORES, get_sensores_by_area
from mqtt import MQTTClient
from hilos import HiloHistorico, HiloRealTime


def log(msg):
    """
    Funcion de logging con salida dual:
    - stdout (para visualizacion en tiempo real)
    - archivo /tmp/bridge.log (para auditacion)

    Args:
        msg: mensaje a registrar
    """
    print(msg, flush=True)
    with open("/tmp/bridge.log", "a") as f:
        f.write(msg + "\n")


def crear_plc(config):
    """
    Crea la instancia del PLC segun configuracion.

    Args:
        config: diccionario de configuracion

    Returns:
        objeto PLCBridge (simulacion o conexion)
    """
    if config["simulation"]:
        log("Modo: SIMULACION")
        from plc_simulacion import PLCBridge as PLCSimulado

        sensores_area = get_sensores_by_area(config["areas"][0], config["planta"])
        return PLCSimulado(sensores_area)
    else:
        log("Modo: PRODUCCION (PLC real)")
        from plc_conexion import PLCBridge as PLCReal

        sensores_area = get_sensores_by_area(config["areas"][0], config["planta"])
        return PLCReal(
            sensores_area,
            host=config["plc_host"],
            port=config["plc_port"],
            unit_id=config["plc_unit_id"],
        )


class SensorPublisher:
    """
    Orquestador principal del bridge industrial.

    Coordina la generacion de datos, conexion MQTT y hilos de publicacion.
    Maneja el ciclo de vida completo del sistema.

    Flujo de operacion:
        1. Cargar configuracion desde entorno
        2. Crear instancia del PLC (simulacion o real)
        3. Conectar a MQTT broker
        4. Iniciar hilos (historico + realtime)
        5. Publicar datos iniciales
        6. Mantener proceso vivo manejando senales

    Atributos:
        config (dict): configuracion del sistema
        plc (PLCBridge): instancia del PLC
        planta (str): identificador de planta
        areas (list): lista de areas a monitorear
        mqtt_client (MQTTClient): cliente MQTT
        hilo_historico (HiloHistorico): hilo muestreo
        hilo_realtime (HiloRealTime): hilo tiempo real
    """

    def __init__(self, config):
        """
        Inicializa todos los componentes del bridge.

        Args:
            config: diccionario de configuracion
        """
        self.config = config
        self.planta = config["planta"]
        self.areas = config["areas"]
        self.real_time_interval = config["real_time_interval"]
        self.historic_interval = config["historic_interval"]

        # Crear instancia del PLC (simulacion o real)
        self.plc = crear_plc(config)

        # Inicializar cliente MQTT con callback de control
        self.mqtt_client = MQTTClient(on_control_callback=self.on_control)
        self.mqtt_client.connect()
        self.mqtt_client.loop_start()

        # Crear hilos de publicacion
        self.hilo_historico = HiloHistorico(self, self.historic_interval, log)
        self.hilo_realtime = HiloRealTime(self, self.real_time_interval, log)

    def on_control(self, active):
        """
        Callback ejecutado al recibir comando de control.

        Args:
            active: True para START, False para STOP
        """
        self.hilo_realtime.set_active(active)

    def _obtener_datos(self):
        """
        Obtiene datos del PLC.

        Returns:
            list: lista de diccionarios con datos de sensores
        """
        return self.plc.leer_datos()

    def publish_historic(self):
        """
         Publica datos de todos los sensores en modo historico.

        Lee datos del PLC y publica via MQTT.
        """
        datos = self._obtener_datos()
        for dato in datos:
            area = dato["area"]
            sensor_id = dato["id"]
            valor = dato["valor"]

            payload = {
                "area": dato["area"],
                "planta": dato["planta"],
                "sensor": dato["id"],
                "nombre": dato["nombre"],
                "valor": valor,
                "timestamp": dato["timestamp"],
            }
            self.mqtt_client.publish(area, payload)
            log(f"[HISTORIC] {sensor_id}: {valor}")

    def publish_realtime(self):
        """
        Publica datos de todos los sensores en modo tiempo real.

        Lee datos del PLC y publica via MQTT.
        """
        datos = self._obtener_datos()
        for dato in datos:
            area = dato["area"]
            sensor_id = dato["id"]
            valor = dato["valor"]

            payload = {
                "area": dato["area"],
                "planta": dato["planta"],
                "sensor": dato["id"],
                "nombre": dato["nombre"],
                "valor": valor,
                "timestamp": dato["timestamp"],
            }
            self.mqtt_client.publish(area, payload)
            log(f"[REALTIME] {sensor_id}: {valor}")

    def start(self):
        """
        Inicia la ejecucion del bridge.

        1. Arrancar hilos
        2. Publicar datos iniciales
        3. Mantener proceso vivo
        """
        self.hilo_historico.start()
        self.hilo_realtime.start()

        # Primera publicacion inmediata
        self.publish_historic()

        # Info de configuracion
        log(f"Bridge iniciado - Planta: {self.planta}, Areas: {', '.join(self.areas)}")
        log(
            f"Intervalos - Historico: {self.historic_interval}s, RealTime: {self.real_time_interval}s"
        )

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            log("\nDeteniendo bridge...")
            self.hilo_historico.stop()
            self.hilo_realtime.stop()
            self.mqtt_client.loop_stop()


if __name__ == "__main__":
    config = get_config()
    publisher = SensorPublisher(config)
    publisher.start()
