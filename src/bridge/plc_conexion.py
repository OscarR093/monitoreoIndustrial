"""
Modulo de conexion al PLC real via Modbus.

Este modulo handlea la comunicacion con el PLC fisico utilizando el protocolo Modbus TCP.
Por defecto esta configurado para usar pymodbus como biblioteca de comunicacion.

Cuando SIMULATION=false en configuracion, main.py usara este modulo
para obtener los datos reales del PLC.

Para usar en modo produccion:
    from plc_conexion import PLCBridge
    plc = PLCBridge(sensores, host, port, unit_id)
    datos = plc.leer_datos()

Nota: Este modulo requiere que el PLC este configurado y accessible.
Los parametros de conexion se definen en variables de entorno.

Autor: Sistema Monitoreo Industrial
Fecha creacion: 2026-04-18
"""

import time


class PLCBridge:
    """
    Puente de comunicacion con el PLC real via Modbus TCP.

    Se conecta al PLC usando pymodbus y lee los valores de los sensores.
    Implementa la misma interfaz que plc_simulacion para mantener
    compatibilidad entre modos.

    Atributos:
        sensores (list): lista de definiciones de sensores
        host (str): direccion IP del PLC
        port (int): puerto de comunicacion Modbus
        unit_id (int): ID de unidad Modbus
        client: cliente Modbus conectado

    Requisitos:
        pip install pymodbus
    """

    def __init__(self, sensores, host="192.168.1.100", port=502, unit_id=1):
        """
        Inicializa la conexion al PLC.

        Args:
            sensores: lista de diccionarios con definiciones de sensores
            host: direccion IP del PLC
            port: puerto Modbus
            unit_id: ID de unidad Modbus

        Nota:
            La conexion real se establece en conectar()
        """
        self.sensores = sensores
        self.host = host
        self.port = port
        self.unit_id = unit_id
        self.client = None

    def conectar(self):
        """
        Establece conexion con el PLC.

        Returns:
            bool: True si la conexion fue exitosa
        """
        try:
            from pymodbus.client import ModbusTcpClient

            self.client = ModbusTcpClient(
                host=self.host,
                port=self.port,
                timeout=5,
            )

            if self.client.connect():
                return True
            return False

        except ImportError:
            print("Error: pymodbus no esta instalado")
            print("Instalar con: pip install pymodbus")
            return False
        except Exception as e:
            print(f"Error al conectar al PLC: {e}")
            return False

    def desconectar(self):
        """
        Cierra la conexion con el PLC.
        """
        if self.client:
            self.client.close()

    def leer_datos(self):
        """
        Lee datos de todos los sensores del PLC.

        Returns:
            list: lista de diccionarios con datos de cada sensor
        """
        if not self.client or not self.client.connected:
            if not self.conectar():
                return self._generar_datos_vacios()

        datos = []
        for sensor in self.sensores:
            try:
                valor = self._leer_registador(sensor["id"])
                datos.append(
                    {
                        "id": sensor["id"],
                        "nombre": sensor["nombre"],
                        "area": sensor["area"],
                        "planta": sensor["planta"],
                        "valor": valor,
                        "timestamp": time.time(),
                    }
                )
            except Exception as e:
                print(f"Error al leer sensor {sensor['id']}: {e}")
                datos.append(
                    {
                        "id": sensor["id"],
                        "nombre": sensor["nombre"],
                        "area": sensor["area"],
                        "planta": sensor["planta"],
                        "valor": None,
                        "timestamp": time.time(),
                    }
                )

        return datos

    def _leer_registador(self, sensor_id):
        """
        Lee un registro especifico del PLC.

        Args:
            sensor_id: identificador del sensor

        Returns:
            float: valor del registro

        Nota:
            Esta es una implementacion placeholder.
            Ajustar segun la configuracion real del PLC.
        """
        direccion = self._obtener_direccion(sensor_id)
        result = self.client.read_input_registers(
            address=direccion,
            count=1,
            slave=self.unit_id,
        )

        if not result.isError():
            return float(result.registers[0])
        return 0.0

    def _obtener_direccion(self, sensor_id):
        """
        Obtiene la direccion Modbus del sensor.

        Args:
            sensor_id: identificador del sensor

        Returns:
            int: direccion del registro

        Mapa de sensores (-placeholder, ajustar segun PLC):
            s1 -> 0
            s2 -> 1
            s3 -> 2
            s4 -> 3
        """
        mapa = {
            "s1": 0,
            "s2": 1,
            "s3": 2,
            "s4": 3,
        }
        return mapa.get(sensor_id, 0)

    def _generar_datos_vacios(self):
        """
        Genera datosplaceholder cuando no hay conexion.

        Returns:
            list: lista con valores None
        """
        return [
            {
                "id": s["id"],
                "nombre": s["nombre"],
                "area": s["area"],
                "planta": s["planta"],
                "valor": None,
                "timestamp": time.time(),
            }
            for s in self.sensores
        ]

    def leer_sensor(self, sensor_id):
        """
        Lee datos de un sensor especifico.

        Args:
            sensor_id: identificador del sensor

        Returns:
            dict: datos del sensor o None
        """
        datos = self.leer_datos()
        for dato in datos:
            if dato["id"] == sensor_id:
                return dato
        return None
