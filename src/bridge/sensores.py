"""
Definiciones de sensores del sistema de monitoreo industrial.

Este archivo contiene la configuracion estatica de todos los sensores:
- ID unico del sensor
- Nombre descriptivo
- Area y planta a la que pertenece

Los sensores se definen como una lista de diccionarios para facilitar
la mantenimiento y extension del sistema.

Estructura de cada sensor:
    {
        "id": identificador unico (s1, s2, etc)
        "nombre": nombre descriptivo (Temperatura, Presion, etc)
        "area": identificador del area (a1, a2, etc)
        "planta": identificador de la planta (p1, p2, etc)
    }

Autor: Sistema Monitoreo Industrial
Fecha creacion: 2026-04-18
"""

# Lista de sensores del sistema
# Agregar nuevos sensores aqui
SENSORES = [
    {
        "id": "s1",
        "nombre": "Temperatura",
        "area": "a1",
        "planta": "p1",
    },
    {
        "id": "s2",
        "nombre": "Presion",
        "area": "a1",
        "planta": "p1",
    },
    {
        "id": "s3",
        "nombre": "Flujo",
        "area": "a1",
        "planta": "p1",
    },
    {
        "id": "s4",
        "nombre": "Nivel",
        "area": "a1",
        "planta": "p1",
    },
]


def get_sensores_by_area(area, planta=None):
    """
    Obtiene lista de sensores para un area especifica.

    Args:
        area: identificador del area (a1, a2, etc)
        planta: identificador opcional de planta (default: None)

    Returns:
        list: lista de sensores del area
    """
    if planta:
        return [s for s in SENSORES if s["area"] == area and s["planta"] == planta]
    return [s for s in SENSORES if s["area"] == area]


def get_sensores_by_planta(planta):
    """
    Obtiene lista de sensores para una planta especifica.

    Args:
        planta: identificador de la planta

    Returns:
        list: lista de sensores de la planta
    """
    return [s for s in SENSORES if s["planta"] == planta]


def get_sensor_by_id(sensor_id):
    """
    Obtiene un sensor por su ID.

    Args:
        sensor_id: identificador del sensor

    Returns:
        dict o None: datos del sensor
    """
    for sensor in SENSORES:
        if sensor["id"] == sensor_id:
            return sensor
    return None
