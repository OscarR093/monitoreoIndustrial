import time
import random
from sensors import get_sensores_list


class PLCSimulation:
    def __init__(self):
        self.valores = {}

    def iniciar(self):
        sensores = get_sensores_list()
        for sensor_id, registro in sensores:
            self.valores[sensor_id] = random.uniform(100, 200)
        print(f"[SIMULACION] Iniciada con {len(sensores)} sensores")

    def leer_datos(self):
        sensores = get_sensores_list()
        datos = []

        for sensor_id, registro in sensores:
            if sensor_id in self.valores:
                variacion = random.uniform(-2, 2)
                self.valores[sensor_id] += variacion
                if self.valores[sensor_id] < 100:
                    self.valores[sensor_id] = 100
                elif self.valores[sensor_id] > 200:
                    self.valores[sensor_id] = 200
            else:
                self.valores[sensor_id] = random.uniform(100, 200)

            datos.append(
                {
                    "sensor": sensor_id,
                    "valor": round(self.valores[sensor_id], 2),
                    "timestamp": time.time(),
                }
            )

        return datos


def obtener_plc(config):
    plc = PLCSimulation()
    plc.iniciar()
    return plc
