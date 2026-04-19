#!/usr/bin/env python3
"""
Script de prueba para enviar comandos START/STOP al bridge via MQTT.

Uso:
    python test_control.py --start               # Enviar START al area por defecto (a1)
    python test_control.py --stop                # Enviar STOP al area por defecto (a1)
    python test_control.py --area a1 --start    # A un area específica
    python test_control.py --area a2 --stop      # A otra area
    python test_control.py --general --start     # Control general (todas las áreas)
    python test_control.py --areas a1,a2 --start  # Múltiples áreas
"""

import argparse
import sys
from dotenv import load_dotenv
import paho.mqtt.client as mqtt
from paho.mqtt.client import CallbackAPIVersion

load_dotenv()


def get_config():
    from src.bridge.config import get_config

    return get_config()


def publish_command(broker, port, planta, topic, command):
    client = mqtt.Client(CallbackAPIVersion.VERSION2)
    try:
        client.connect(broker, port, 60)
        client.loop_start()
        result = client.publish(topic, command)
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"[OK] Enviado '{command}' a {topic}")
            return True
        else:
            print(f"[ERROR] Falló publicación: {result.rc}")
            return False
    except Exception as e:
        print(f"[ERROR] Conexión fallida: {e}")
        return False
    finally:
        client.loop_stop()


def main():
    parser = argparse.ArgumentParser(description="Enviar comandos START/STOP al bridge")
    parser.add_argument("--start", action="store_true", help="Enviar comando START")
    parser.add_argument("--stop", action="store_true", help="Enviar comando STOP")
    parser.add_argument("--area", type=str, help="Area específica (ej: a1)")
    parser.add_argument(
        "--general", action="store_true", help="Control general (todas las áreas)"
    )
    parser.add_argument(
        "--areas", type=str, help="Áreas separadas por coma (ej: a1,a2)"
    )

    args = parser.parse_args()

    if not args.start and not args.stop:
        print("Especifica --start o --stop")
        parser.print_help()
        sys.exit(1)

    command = "START" if args.start else "STOP"
    config = get_config()

    planta = config["planta"]
    broker = config["mqtt_broker"]
    port = config["mqtt_port"]

    topics = []

    if args.general:
        topics.append(f"industrial/{planta}/control")
    elif args.areas:
        for area in args.areas.split(","):
            topics.append(f"industrial/{planta}/{area}/control")
    elif args.area:
        topics.append(f"industrial/{planta}/{args.area}/control")
    else:
        default_area = config["areas"][0] if config["areas"] else "a1"
        topics.append(f"industrial/{planta}/{default_area}/control")

    success = True
    for topic in topics:
        if not publish_command(broker, port, planta, topic, command):
            success = False

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
