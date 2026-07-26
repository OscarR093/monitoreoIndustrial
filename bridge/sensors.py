SENSORES = [
    {"id": "s1", "registro": 0, "tipo": "analogico"},
    {"id": "s2", "registro": 1, "tipo": "analogico"},
    {"id": "s3", "registro": 2, "tipo": "analogico"},
    {"id": "s4", "registro": 3, "tipo": "analogico"},
    {"id": "d1", "registro": 100, "tipo": "digital", "modo": "estado"},
    {"id": "d2", "registro": 101, "tipo": "digital", "modo": "estado"},
    {"id": "c1", "registro": 200, "tipo": "digital", "modo": "contador"},
]


def get_sensores():
    return SENSORES


def get_sensor_ids():
    return [s["id"] for s in SENSORES]


def get_sensores_list():
    return [(s["id"], s["registro"], s["tipo"], s.get("modo")) for s in SENSORES]
