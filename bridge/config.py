import os
from dotenv import load_dotenv

load_dotenv()

_config_cache = None


def get_config():
    global _config_cache
    if _config_cache is None:
        _config_cache = {
            "mqtt_broker": os.getenv("MQTT_BROKER", "localhost"),
            "mqtt_port": int(os.getenv("MQTT_PORT", "1883")),
            "plc_host": os.getenv("PLC_HOST", "192.168.1.100"),
            "plc_port": int(os.getenv("PLC_PORT", "502")),
            "plc_unit_id": int(os.getenv("PLC_UNIT_ID", "1")),
            "planta": os.getenv("PLANTA", "p1"),
            "area": os.getenv("AREA", "a1"),
            "history_interval": int(os.getenv("HISTORY_INTERVAL", "1200")),
            "realtime_interval": int(os.getenv("REALTIME_INTERVAL", "2")),
            "simulation": os.getenv("SIMULATION", "true").lower() == "true",
        }
    return _config_cache


def get_topic(tipo):
    cfg = get_config()
    return f"industrial/{cfg['planta']}/{cfg['area']}/{tipo}"


def get_topics():
    cfg = get_config()
    planta = cfg["planta"]
    area = cfg["area"]
    return {
        "history": f"industrial/{planta}/{area}/history",
        "realtime": f"industrial/{planta}/{area}/realtime",
        "control": f"industrial/{planta}/{area}/control",
    }


def get_topics_from_params(planta, area):
    return {
        "history": f"industrial/{planta}/{area}/history",
        "realtime": f"industrial/{planta}/{area}/realtime",
        "control": f"industrial/{planta}/{area}/control",
    }


def extract_area_from_topic(topic):
    parts = topic.strip("/").split("/")
    if len(parts) >= 3 and parts[2] == "control":
        return {"planta": parts[0], "area": parts[1]}
    return None
