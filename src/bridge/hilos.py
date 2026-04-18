"""
Modulo de hilos para ejecucion concurrente del bridge industrial.

Define dos hilos separados para manejar los diferentes modos de publicacion:
    - HiloHistorico: publicacion periodica cada X segundos (default 20 min)
    - HiloRealTime: publicacion rapida cuando esta activada (default 2s)

Ambos hilos corren simultaneamente de forma independiente:
    - El hilo historico siempre esta activo, publicando a su intervalo
    - El hilo tiempo real esta corriendo pero dormido, cuando recibe
      el comando START se activa y publica rapidamente

Esta arquitectura asegura que el tiempo real no bloquee el muestreo historico.

Autor: Sistema Monitoreo Industrial
Fecha creacion: 2026-04-18
"""

import threading
import time


def log(msg):
    """
    Funcion auxiliar para logging con flush inmediato.

    Args:
        msg: mensaje a imprimir
    """
    print(msg, flush=True)


class HiloHistorico(threading.Thread):
    """
    Hilo para publicacion periodica de datos (muestreo).

    Publica datos de sensores a intervalos regulares independiente
    de si el modo tiempo real esta activo o no.
    Intervalo configurable via HISTORIC_INTERVAL (default 20 minutos = 1200s).

    Este hilo NUNCA se detiene automaticamente, corre continuamente
    como parte del sistema de muestreo del PLC.

    Atributos:
        publisher: objeto con metodo publish_historic()
        interval: segundos entre publicaciones
        running: bandera para control de ejecucion
        log: funcion de logging
    """

    def __init__(self, publisher, interval, logger=log):
        """
        Inicializa el hilo historico.

        Args:
            publisher: objeto con metodo publish_historic()
            interval: intervalo en segundos
            logger: funcion de logging
        """
        super().__init__(daemon=True)
        # daemon=True permite cerrar el proceso sin esperar este hilo
        self.publisher = publisher
        self.interval = interval
        self.running = True
        self.log = logger

    def run(self):
        """
        Bucle principal del hilo historico.

        Publica datos y luego espera el intervalo configurado.
        Se ejecuta continuamente hasta que running=False.
        """
        self.log(f"Hilo histórico iniciado (intervalo: {self.interval}s)")
        while self.running:
            self.publisher.publish_historic()
            time.sleep(self.interval)

    def stop(self):
        """
        Solicita la detencion del hilo.

        Nota: el hilo se detendra luego de la siguiente publicacion.
        """
        self.running = False


class HiloRealTime(threading.Thread):
    """
    Hilo para publicacion en tiempo real.

    Permanece en estado dormido hasta recibir el comando START.
    Cuando esta activo, publica datos a intervalo rapido (default 2s).

    Diferencia con HiloHistorico:
        - Historico: siempre corre, intervalo largo
        - RealTime: solo cuando se activa, intervalo corto

    Esto permite ver datos en tiempo real sin afectar el muestreo
    periodico del sistema.

    Atributos:
        publisher: objeto con metodo publish_realtime()
        interval: segundos entre publicaciones cuando activo
        active: bandera de estado tiempo real
        running: bandera para control de ejecucion
        log: funcion de logging
    """

    def __init__(self, publisher, interval, logger=log):
        """
        Inicializa el hilo tiempo real.

        Args:
            publisher: objeto con metodo publish_realtime()
            interval: intervalo en segundos cuando activo
            logger: funcion de logging
        """
        super().__init__(daemon=True)
        self.publisher = publisher
        self.interval = interval
        self.active = False  # Inicia desactivado
        self.running = True
        self.log = logger

    def run(self):
        """
        Bucle principal del hilo tiempo real.

        Si active=True: publica y espera intervalo.
        Si active=False: solo espera (no publica).

        Esta logica permite activacion/desactivacion dinamica
        sin crear/destruir hilos.
        """
        self.log(f"Hilo tiempo real iniciado (intervalo: {self.interval}s)")
        while self.running:
            if self.active:
                self.publisher.publish_realtime()
                time.sleep(self.interval)
            else:
                # Dormir poco para respuesta rapida al activar
                time.sleep(0.5)

    def set_active(self, active):
        """
        Activa o desactiva la publicacion en tiempo real.

        Args:
            active: True para activar, False para desactivar
        """
        self.active = active
        self.log(f"RealTime {'activado' if active else 'desactivado'}")

    def stop(self):
        """
        Solicita la detencion del hilo.

        El hilo terminara en la proxima iteracion del bucle.
        """
        self.running = False
