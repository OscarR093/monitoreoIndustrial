import json
import paho.mqtt.client as mqtt
from config import get_topics


class MQTTClient:
    def __init__(self, broker, port, topics_callback=None):
        self.broker = broker
        self.port = port
        self.client = mqtt.Client()
        self.topics_callback = topics_callback
        self.conectado = False
        self.topics_to_subscribe = []
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message

    def conectar(self):
        try:
            self.client.connect(self.broker, self.port, 60)
            self.client.loop_start()
            print(f"[MQTT] Conectado a {self.broker}:{self.port}")
            return True
        except Exception as e:
            print(f"[MQTT] Error de conexión: {e}")
            return False

    def desconectar(self):
        self.client.loop_stop()
        self.client.disconnect()
        print("[MQTT] Desconectado")

    def suscribir(self, topic):
        if self.conectado:
            self.client.subscribe(topic)
            print(f"[MQTT] Suscrito a {topic}")
        else:
            self.topics_to_subscribe.append(topic)

    def publicar(self, topic, payload):
        try:
            if isinstance(payload, dict):
                payload = json.dumps(payload)
            elif isinstance(payload, list):
                payload = json.dumps(payload)
            resultado = self.client.publish(topic, payload)
            if resultado.rc == mqtt.MQTT_ERR_SUCCESS:
                return True
            else:
                print(f"[MQTT] Error al publicar: {resultado.rc}")
                return False
        except Exception as e:
            print(f"[MQTT] Error al publicar: {e}")
            return False

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.conectado = True
            print("[MQTT] Conexión establecida")
            for topic in self.topics_to_subscribe:
                client.subscribe(topic)
                print(f"[MQTT] Suscrito a {topic}")
            self.topics_to_subscribe = []
        else:
            print(f"[MQTT] Error de conexión: {rc}")

    def _on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode("utf-8")
            topic = msg.topic
            print(f"[MQTT] Mensaje recibido en {topic}: {payload}")
            if self.topics_callback:
                self.topics_callback(topic, payload)
        except Exception as e:
            print(f"[MQTT] Error procesando mensaje: {e}")


def obtener_mqtt(config, topics_callback=None):
    return MQTTClient(
        broker=config["mqtt_broker"],
        port=config["mqtt_port"],
        topics_callback=topics_callback,
    )
