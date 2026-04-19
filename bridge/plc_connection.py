import time
from pymodbus.client import ModbusTcpClient
from sensors import get_sensores_list


class PLCConnection:
    def __init__(self, host, port, unit_id=1):
        self.host = host
        self.port = port
        self.unit_id = unit_id
        self.client = None
        self.conectado = False

    def conectar(self):
        try:
            self.client = ModbusTcpClient(
                host=self.host, port=self.port, unit_id=self.unit_id
            )
            if self.client.connect():
                self.conectado = True
                print(f"[PLC] Conectado a {self.host}:{self.port}")
                return True
            else:
                print(f"[PLC] No se pudo conectar a {self.host}:{self.port}")
                return False
        except Exception as e:
            print(f"[PLC] Error de conexión: {e}")
            return False

    def desconectar(self):
        if self.client:
            self.client.close()
            self.conectado = False
            print("[PLC] Desconectado")

    def leer_datos(self):
        if not self.conectado or not self.client:
            return self._generar_datos_vacios()

        datos = []
        sensores = get_sensores_list()

        for sensor_id, registro in sensores:
            try:
                respuesta = self.client.read_input_registers(
                    address=registro, count=1, unit=self.unit_id
                )
                if not respuesta.isError():
                    valor = respuesta.registers[0]
                else:
                    valor = 0
            except Exception as e:
                print(f"[PLC] Error leyendo registro {registro}: {e}")
                valor = 0

            datos.append(
                {"sensor": sensor_id, "valor": float(valor), "timestamp": time.time()}
            )

        return datos

    def _generar_datos_vacios(self):
        sensores = get_sensores_list()
        return [
            {"sensor": sensor_id, "valor": 0.0, "timestamp": time.time()}
            for sensor_id, _ in sensores
        ]


def obtener_plc(config):
    return PLCConnection(
        host=config["plc_host"], port=config["plc_port"], unit_id=config["plc_unit_id"]
    )
