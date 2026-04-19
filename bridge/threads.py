import threading
import time


class HiloPublicador(threading.Thread):
    def __init__(self, nombre, intervalo, mqtt_client, topic, plc, callback=None):
        super().__init__(daemon=True)
        self.nombre = nombre
        self.intervalo = intervalo
        self.mqtt_client = mqtt_client
        self.topic = topic
        self.plc = plc
        self.callback = callback
        self.activo = False
        self.pausado = False
        self.detenido = False

    def run(self):
        self.activo = True
        while not self.detenido:
            if self.pausado:
                time.sleep(0.5)
                continue

            datos = self.plc.leer_datos()
            if datos:
                self.mqtt_client.publicar(self.topic, datos)
                print(f"[{self.nombre}]Publicado en {self.topic}")
                if self.callback:
                    self.callback(datos)

            for _ in range(self.intervalo):
                if self.detenido:
                    break
                time.sleep(1)

        self.activo = False

    def pausar(self):
        self.pausado = True
        print(f"[{self.nombre}] Pausado")

    def reanudar(self):
        self.pausado = False
        print(f"[{self.nombre}] Reanudado")

    def detener(self):
        self.detenido = True
        print(f"[{self.nombre}] Detenido")


class HiloHistory(threading.Thread):
    def __init__(self, intervalo, mqtt_client, topic, plc):
        super().__init__(daemon=True)
        self.intervalo = intervalo
        self.mqtt_client = mqtt_client
        self.topic = topic
        self.plc = plc
        self.activo = False
        self.detenido = False

    def run(self):
        self.activo = True
        print(f"[HISTORY] Hilo iniciado (intervalo: {self.intervalo}s)")

        while not self.detenido:
            datos = self.plc.leer_datos()
            if datos:
                self.mqtt_client.publicar(self.topic, datos)
                print(f"[HISTORY]Publicado en {self.topic}")

            for _ in range(self.intervalo):
                if self.detenido:
                    break
                time.sleep(1)

        self.activo = False

    def detener(self):
        self.detenido = True
        print("[HISTORY] Detenido")


class HiloRealTime(threading.Thread):
    def __init__(self, intervalo, mqtt_client, topic, plc):
        super().__init__(daemon=True)
        self.intervalo = intervalo
        self.mqtt_client = mqtt_client
        self.topic = topic
        self.plc = plc
        self.activo = False
        self.habilitado = False
        self.detenido = False

    def run(self):
        self.activo = True
        print(
            f"[REALTIME] Hilo iniciado (intervalo: {self.intervalo}s), inicialmente deshabilitado"
        )

        while not self.detenido:
            if not self.habilitado:
                time.sleep(0.5)
                continue

            datos = self.plc.leer_datos()
            if datos:
                self.mqtt_client.publicar(self.topic, datos)
                print(f"[REALTIME]Publicado en {self.topic}")

            for _ in range(self.intervalo):
                if self.detenido:
                    break
                time.sleep(1)

        self.activo = False

    def habilitar(self):
        self.habilitado = True
        print(f"[REALTIME] Habilitado")

    def deshabilitar(self):
        self.habilitado = False
        print(f"[REALTIME] Deshabilitado")

    def detener(self):
        self.detenido = True
        print("[REALTIME] Detenido")


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
