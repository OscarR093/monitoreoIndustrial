SENSORES = [
    {"id": "s1", "registro": 0},
    {"id": "s2", "registro": 1},
    {"id": "s3", "registro": 2},
    {"id": "s4", "registro": 3},
]


def get_sensores():
    return SENSORES


def get_sensor_ids():
    return [s["id"] for s in SENSORES]


def get_sensores_list():
    return [(s["id"], s["registro"]) for s in SENSORES]
