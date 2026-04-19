import signal
import sys
from config import get_config, get_topics
from mqtt_client import obtener_mqtt
from threads import crear_hilos
from plc_connection import obtener_plc as obtener_plc_real
from plc_simulation import obtener_plc as obtener_plc_sim


class Bridge:
    def __init__(self):
        self.config = get_config()
        self.config["topics"] = get_topics()
        self.mqtt_client = None
        self.plc = None
        self.hilo_history = None
        self.hilo_realtime = None
        self.running = True

    def iniciar(self):
        print("=" * 50)
        print("BRIDGE PLC -> MQTT")
        print("=" * 50)
        print(f"Planta: {self.config['planta']}")
        print(f"Area: {self.config['area']}")
        print(f"Topics:")
        print(f"  - History:   {self.config['topics']['history']}")
        print(f"  - Realtime:  {self.config['topics']['realtime']}")
        print(f"  - Control:  {self.config['topics']['control']}")
        print(f"Simulation: {self.config['simulation']}")
        print(f"Intervalos:")
        print(f"  - History:   {self.config['history_interval']}s")
        print(f"  - Realtime:  {self.config['realtime_interval']}s")
        print("=" * 50)

        self.plc = self._obtener_plc()
        self.mqtt_client = obtener_mqtt(self.config, self._on_mqtt_message)

        if not self.mqtt_client.conectar():
            print("ERROR: No se pudo conectar al broker MQTT")
            return False

        self.mqtt_client.suscribir(self.config["topics"]["control"])

        self.hilo_history, self.hilo_realtime = crear_hilos(
            self.config, self.mqtt_client, self.plc
        )

        self.hilo_history.start()
        self.hilo_realtime.start()

        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

        return True

    def ejecutar(self):
        while self.running:
            try:
                signal.pause()
            except InterruptedError:
                pass

    def _obtener_plc(self):
        if self.config["simulation"]:
            print("[MAIN] Usando PLC simulacion")
            return obtener_plc_sim(self.config)
        else:
            print("[MAIN] Usando PLC real")
            plc = obtener_plc_real(self.config)
            plc.conectar()
            return plc

    def _on_mqtt_message(self, topic, payload):
        comando = payload.strip().upper()
        print(f"[MAIN] Comando recibido: {comando}")

        if comando == "START":
            self.hilo_realtime.habilitar()
        elif comando == "STOP":
            self.hilo_realtime.deshabilitar()
        else:
            print(f"[MAIN] Comando desconocido: {comando}")

    def _signal_handler(self, signum, frame):
        print("\n[MAIN] Señal de terminacion recibida")
        self.detener()

    def detener(self):
        self.running = False
        print("[MAIN] Deteniendo hilos...")

        if self.hilo_history:
            self.hilo_history.detener()
        if self.hilo_realtime:
            self.hilo_realtime.detener()

        if self.plc and hasattr(self.plc, "desconectar"):
            self.plc.desconectar()

        if self.mqtt_client:
            self.mqtt_client.desconectar()

        print("[MAIN] Puente detenido")


def main():
    bridge = Bridge()
    if bridge.iniciar():
        bridge.ejecutar()
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
