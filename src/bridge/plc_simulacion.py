"""
Modulo de simulacion de datos del PLC.

Genera datos simulados de sensores industriales con valores incrementales.
Utilizado para pruebas y desarrollo cuando no se tiene acceso al PLC real.

Cada sensor mantiene un valor incremental que varia entre 100 y 200,
simulando lecturas analogicas de un sensor real.

Para usar en modo simulacion:
    from plc_simulacion import PLCBridge
    plc = PLCBridge(sensores)
    datos = plc.leer_datos()

Autor: Sistema Monitoreo Industrial
Fecha creacion: 2026-04-18
"""

import random
import time


class SensorSimulado:
    """
    Representa un sensor simulado con lectura incremental.

    Mantiene el estado actual del sensor y genera nuevos valores
    sumando una variacion aleatoria al valor anterior.

    Atributos:
        id (str): identificador del sensor
        nombre (str): nombre descriptivo
        area (str): identificador del area
        planta (str): identificador de la planta
        current_value (float): valor actual de la lectura
    """

    def __init__(self, sensor_def):
        """
        Inicializa el sensor simulado.

        Args:
            sensor_def: diccionario con id, nombre, area, planta
        """
        self.id = sensor_def["id"]
        self.nombre = sensor_def["nombre"]
        self.area = sensor_def["area"]
        self.planta = sensor_def["planta"]
        self.current_value = random.uniform(100, 200)

    def generar(self):
        """
        Genera una nueva lectura incremental.

        Aplica una variacion aleatoria entre -2 y +2 al valor actual,
        manteniendo los limites entre 100 y 200.

        Returns:
            dict: datos del sensor con valor y timestamp
        """
        variation = random.uniform(-2, 2)
        self.current_value += variation
        self.current_value = max(100, min(200, self.current_value))

        return {
            "id": self.id,
            "nombre": self.nombre,
            "area": self.area,
            "planta": self.planta,
            "valor": round(self.current_value, 2),
            "timestamp": time.time(),
        }


class PLCBridge:
    """
    puente de comunicacion simulado para el PLC.

    Genera datos de sensores en modo simulacion.
    Mantiene el estado de todos los sensores y genera lecturas
    incrementales cuando se solicita.

    Atributos:
        sensores (list): lista de definiciones de sensores
        _sensores_activos (dict): objetos SensorSimulado por ID
    """

    def __init__(self, sensores):
        """
        Inicializa el puente simulado.

        Args:
            sensores: lista de diccionarios con definiciones de sensores
        """
        self.sensores = sensores
        self._sensores_activos = {}

        for sensor_def in sensores:
            self._sensores_activos[sensor_def["id"]] = SensorSimulado(sensor_def)

    def leer_datos(self):
        """
        Lee datos de todos los sensores simulados.

        Returns:
            list: lista de diccionarios con datos de cada sensor
        """
        datos = []
        for sensor in self._sensores_activos.values():
            datos.append(sensor.generar())
        return datos

    def leer_sensor(self, sensor_id):
        """
        Lee datos de un sensor especifico.

        Args:
            sensor_id: identificador del sensor

        Returns:
            dict: datos del sensor o None
        """
        if sensor_id in self._sensores_activos:
            return self._sensores_activos[sensor_id].generar()
        return None
