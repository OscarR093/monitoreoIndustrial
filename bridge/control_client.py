import sys
import time
import paho.mqtt.client as mqtt


def enviar_comando(broker, port, planta, area, comando):
    client = mqtt.Client()
    topic = f"industrial/{planta}/{area}/control"

    client.connect(broker, port, 60)
    client.loop_start()
    time.sleep(0.5)

    result = client.publish(topic, comando)

    if result.rc == mqtt.MQTT_ERR_SUCCESS:
        print(f"[OK] Comando '{comando}' enviado a {topic}")
    else:
        print(f"[ERROR] Fallo al enviar comando")

    time.sleep(0.5)
    client.loop_stop()
    client.disconnect()


def main():
    import os

    broker = os.getenv("MQTT_BROKER", "localhost")
    port = int(os.getenv("MQTT_PORT", "1883"))
    planta = os.getenv("PLANTA", "p1")
    area = os.getenv("AREA", "a1")

    if len(sys.argv) < 2:
        print("Uso: python control_client.py <START|STOP>")
        print("Ejemplo: python control_client.py START")
        sys.exit(1)

    comando = sys.argv[1].strip().upper()
    if comando not in ("START", "STOP"):
        print("Comando debe ser START o STOP")
        sys.exit(1)

    enviar_comando(broker, port, planta, area, comando)


if __name__ == "__main__":
    main()
