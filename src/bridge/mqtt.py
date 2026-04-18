"""
Modulo de conexion MQTT para el bridge industrial.

Maneja la conexion al broker EMQX, suscripcion a topics de control
y publicacion de datos de sensores.

Topics utilizados:
    - Publication: industrial/{planta}/{area}/sensores
    - Control area: industrial/{planta}/{area}/control
    - Control general: industrial/{planta}/control

Comandos de control:
    - START: activa modo tiempo real
    - STOP: desactiva modo tiempo real

Autor: Sistema Monitoreo Industrial
Fecha creacion: 2026-04-18
"""

import paho.mqtt.client as mqtt
from paho.mqtt.client import CallbackAPIVersion
import json
from config import get_config


def log(msg):
    """
    Funcion auxiliar para logging con flush imediato.

    Args:
        msg: mensaje a imprimir
    """
    print(msg, flush=True)


class MQTTClient:
    """
    Cliente MQTT para el bridge industrial.

    Maneja conexion, suscripcion y publicacion de datos.
    Responde a comandos START/STOP en topics de control.

    Atributos:
        broker (str): direccion del broker MQTT
        port (int): puerto de conexion
        planta (str): identificador de planta
        areas (list): lista de areas a monitorear
        client: cliente paho-mqtt
        on_control_callback: funcion a llamar al recibir control
    """

    def __init__(self, on_control_callback=None):
        """
        Inicializa el cliente MQTT con configuracion.

        Args:
            on_control_callback: funcion(bool) llamada al recibir START/STOP
        """
        config = get_config()
        self.broker = config["mqtt_broker"]
        self.port = config["mqtt_port"]
        self.planta = config["planta"]
        self.areas = config["areas"]
        # VERSION2 es requerida para paho-mqtt 2.0+
        self.client = mqtt.Client(CallbackAPIVersion.VERSION2)
        self.on_control_callback = on_control_callback
        self._setup_callbacks()

    def _setup_callbacks(self):
        """
        Configura los callbacks de conexion y mensajes.
        """
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message

    def _on_connect(self, client, userdata, flags, rc, properties=None):
        """
        Callback ejecutado al conectar al broker.

        Suscribe a:
            - industrial/{planta}/{area}/control (por cada area)
            - industrial/{planta}/control (general para todas las areas)

        Args:
            client: cliente MQTT
            userdata: datos de usuario
            flags: flags de conexion
            rc: codigo de resultado (0 = exito)
            properties: propiedades MQTTv5 (opcional)
        """
        if rc == 0:
            log(f"Conectado a MQTT broker en {self.broker}:{self.port}")
            # Suscribir a control por area
            for area in self.areas:
                topic_control = f"industrial/{self.planta}/{area}/control"
                self.client.subscribe(topic_control)
                log(f"Suscrito a {topic_control}")
            # Suscribir a control general (activa todas las areas)
            topic_general = f"industrial/{self.planta}/control"
            self.client.subscribe(topic_general)
            log(f"Suscrito a {topic_general}")
        else:
            log(f"Error de conexión: {rc}")

    def _on_message(self, client, userdata, msg, properties=None):
        """
        Callback ejecutado al recibir un mensaje.

        Procesa comandos START y STOP para activar/desactivar
        el modo tiempo real.

        Args:
            client: cliente MQTT
            userdata: datos de usuario
            msg: mensaje recibido
            properties: propiedades MQTTv5 (opcional)
        """
        topic = msg.topic
        payload = msg.payload.decode()
        log(f"Mensaje en {topic}: {payload}")

        # Comandos de control
        if payload.upper() == "START":
            if self.on_control_callback:
                self.on_control_callback(True)
        elif payload.upper() == "STOP":
            if self.on_control_callback:
                self.on_control_callback(False)

    def connect(self):
        """
        Conecta al broker MQTT.

        Timeout de conexion: 60 segundos
        """
        self.client.connect(self.broker, self.port, 60)

    def publish(self, area, data):
        """
        Publica datos de sensor en el topic correspondiente.

        Formato del topic: industrial/{planta}/{area}/sensores
        Formato del payload: JSON con datos del sensor

        Args:
            area: identificador del area
            data: diccionario con datos del sensor
        """
        topic = f"industrial/{self.planta}/{area}/sensores"
        payload = json.dumps(data)
        self.client.publish(topic, payload)

    def loop_start(self):
        """
        Inicia el loop de procesamiento de mensajes en un hilo separado.
        """
        self.client.loop_start()

    def loop_stop(self):
        """
        Detiene el loop de procesamiento de mensajes.
        """
        self.client.loop_stop()
