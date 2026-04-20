import threading
import time


class HiloBase(threading.Thread):
    def __init__(self, nombre, intervalo, mqtt_client, topic, plc):
        super().__init__(daemon=True)
        self.nombre = nombre
        self.intervalo = intervalo
        self.mqtt_client = mqtt_client
        self.topic = topic
        self.plc = plc
        self.detener_event = threading.Event()

    def run_loop(self):
        while not self.detener_event.is_set():
            datos = self.plc.leer_datos()
            if datos:
                self.mqtt_client.publicar(self.topic, datos)
                print(f"[{self.nombre}]Publicado en {self.topic}")

            for _ in range(self.intervalo):
                if self.detener_event.is_set():
                    break
                time.sleep(1)

    def detener(self):
        self.detener_event.set()
        print(f"[{self.nombre}] Detenido")


class HiloHistory(HiloBase):
    def __init__(self, intervalo, mqtt_client, topic, plc):
        super().__init__("HISTORY", intervalo, mqtt_client, topic, plc)

    def run(self):
        print(f"[HISTORY] Hilo iniciado (intervalo: {self.intervalo}s)")
        self.run_loop()


class HiloRealTime(HiloBase):
    def __init__(self, intervalo, mqtt_client, topic, plc):
        super().__init__("REALTIME", intervalo, mqtt_client, topic, plc)
        self.habilitado_event = threading.Event()

    def run(self):
        print(
            f"[REALTIME] Hilo iniciado (intervalo: {self.intervalo}s), inicialmente deshabilitado"
        )
        while not self.detener_event.is_set():
            if not self.habilitado_event.is_set():
                time.sleep(0.5)
                continue

            datos = self.plc.leer_datos()
            if datos:
                self.mqtt_client.publicar(self.topic, datos)
                print(f"[REALTIME]Publicado en {self.topic}")

            for _ in range(self.intervalo):
                if self.detener_event.is_set():
                    break
                time.sleep(1)

    def habilitar(self):
        self.habilitado_event.set()
        print(f"[REALTIME] Habilitado")

    def deshabilitar(self):
        self.habilitado_event.clear()
        print(f"[REALTIME] Deshabilitado")


def crear_hilos(config, mqtt_client, plc):
    topics = config["topics"]
    history_interval = config["history_interval"]
    realtime_interval = config["realtime_interval"]

    hilo_history = HiloHistory(
        intervalo=history_interval,
        mqtt_client=mqtt_client,
        topic=topics["history"],
        plc=plc,
    )

    hilo_realtime = HiloRealTime(
        intervalo=realtime_interval,
        mqtt_client=mqtt_client,
        topic=topics["realtime"],
        plc=plc,
    )

    return hilo_history, hilo_realtime
