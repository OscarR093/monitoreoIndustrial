import time
import random
from sensors import get_sensores_list


class PLCSimulation:
    def __init__(self):
        self.sensores = get_sensores_list()
        self.estados = {}
        self.cambios = {}

    def iniciar(self):
        for sid, registro, tipo, modo in self.sensores:
            if tipo == "analogico":
                self.estados[sid] = random.uniform(100, 200)
            elif modo == "contador":
                self.estados[sid] = random.randint(1000, 5000)
                self.cambios[sid] = 0
            else:
                self.estados[sid] = random.choice([0, 1])
                self.cambios[sid] = 0
        print(f"[SIMULACION] Iniciada con {len(self.sensores)} sensores")

    def leer_datos(self):
        """Return current state for realtime (cambios always 0)."""
        datos = []
        for sid, registro, tipo, modo in self.sensores:
            self._actualizar_estado(sid, tipo, modo)

            valor = self.estados.get(sid, 0)
            dato = {
                "sensor": sid,
                "valor": round(valor, 2) if tipo == "analogico" else valor,
                "tipo": tipo,
                "cambios": 0,
                "timestamp": time.time(),
            }
            if modo is not None:
                dato["modo"] = modo
            datos.append(dato)
        return datos

    def leer_history(self):
        """Return data with accumulated cambios for digital sensors, then reset counters."""
        datos = []
        for sid, registro, tipo, modo in self.sensores:
            self._actualizar_estado(sid, tipo, modo)

            valor = self.estados.get(sid, 0)
            dato = {
                "sensor": sid,
                "valor": round(valor, 2) if tipo == "analogico" else valor,
                "tipo": tipo,
                "cambios": self.cambios.get(sid, 0),
                "timestamp": time.time(),
            }
            if modo is not None:
                dato["modo"] = modo
            datos.append(dato)

        for sid in self.cambios:
            self.cambios[sid] = 0

        return datos

    def _actualizar_estado(self, sid, tipo, modo):
        if tipo == "analogico":
            if sid not in self.estados:
                self.estados[sid] = random.uniform(100, 200)
            variacion = random.uniform(-2, 2)
            self.estados[sid] += variacion
            if self.estados[sid] < 100:
                self.estados[sid] = 100
            elif self.estados[sid] > 200:
                self.estados[sid] = 200
        elif modo == "contador":
            if sid not in self.estados:
                self.estados[sid] = random.randint(1000, 5000)
                self.cambios[sid] = 0
            incremento = random.randint(0, 3)
            self.estados[sid] += incremento
            self.cambios[sid] = self.cambios.get(sid, 0) + incremento
        else:
            if sid not in self.estados:
                self.estados[sid] = random.choice([0, 1])
                self.cambios[sid] = 0
            if random.random() < 0.05:
                estado_anterior = self.estados[sid]
                self.estados[sid] = 1 - estado_anterior
                self.cambios[sid] = self.cambios.get(sid, 0) + 1


def obtener_plc(config):
    plc = PLCSimulation()
    plc.iniciar()
    return plc
