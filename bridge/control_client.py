import sys
import time
import ssl
import os
import paho.mqtt.client as mqtt


def enviar_comando(broker, port, planta, area, comando, use_tls=False, username="", password=""):
    client = mqtt.Client()
    topic = f"industrial/{planta}/{area}/control"

    if username and password:
        client.username_pw_set(username, password)
    if use_tls:
        client.tls_set(cert_reqs=ssl.CERT_REQUIRED, tls_version=ssl.PROTOCOL_TLS)

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
    broker = os.getenv("MQTT_BROKER", "localhost")
    port = int(os.getenv("MQTT_PORT", "1883"))
    planta = os.getenv("PLANTA", "p1")
    area = os.getenv("AREA", "a1")
    use_tls = os.getenv("MQTT_USE_TLS", "false").lower() == "true"
    username = os.getenv("MQTT_USER", "")
    password = os.getenv("MQTT_PASS", "")

    if len(sys.argv) < 2:
        print("Uso: python control_client.py <START|STOP>")
        print("Ejemplo: python control_client.py START")
        sys.exit(1)

    comando = sys.argv[1].strip().upper()
    if comando not in ("START", "STOP"):
        print("Comando debe ser START o STOP")
        sys.exit(1)

    enviar_comando(broker, port, planta, area, comando, use_tls, username, password)


if __name__ == "__main__":
    main()
