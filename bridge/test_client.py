import json
import sys
import paho.mqtt.client as mqtt


class TestClient:
    def __init__(self, broker="localhost", port=1883, planta="p1", area="a1"):
        self.broker = broker
        self.port = port
        self.planta = planta
        self.area = area
        self.client = mqtt.Client()
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message

    def iniciar(self):
        self.client.connect(self.broker, self.port, 60)
        self.client.loop_start()
        print(f"[TEST] Conectado a {self.broker}:{self.port}")
        print(f"[TEST] Escuchando: industrial/{self.planta}/{self.area}/#")
        print("=" * 50)

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            history_topic = f"industrial/{self.planta}/{self.area}/history"
            realtime_topic = f"industrial/{self.planta}/{self.area}/realtime"
            client.subscribe(history_topic)
            client.subscribe(realtime_topic)
            print(f"[TEST] Suscrito a {history_topic}")
            print(f"[TEST] Suscrito a {realtime_topic}")
        else:
            print(f"[TEST] Error de conexión: {rc}")

    def _on_message(self, client, userdata, msg):
        try:
            payload = msg.payload.decode("utf-8")
            print(f"\n[TEST] Topic: {msg.topic}")
            try:
                datos = json.loads(payload)
                print(f"[TEST] Datos:")
                if isinstance(datos, list):
                    for d in datos:
                        print(
                            f"       - sensor: {d.get('sensor')}, valor: {d.get('valor')}, ts: {d.get('timestamp')}"
                        )
                else:
                    print(f"       {datos}")
            except json.JSONDecodeError:
                print(f"[TEST] Payload (raw): {payload}")
        except Exception as e:
            print(f"[TEST] Error: {e}")


def main():
    import os

    broker = os.getenv("MQTT_BROKER", "localhost")
    port = int(os.getenv("MQTT_PORT", "1883"))
    planta = os.getenv("PLANTA", "p1")
    area = os.getenv("AREA", "a1")

    cliente = TestClient(broker, port, planta, area)
    cliente.iniciar()

    try:
        while True:
            input()
    except KeyboardInterrupt:
        print("\n[TEST] Detenido")


if __name__ == "__main__":
    main()
