# Sistema de Monitoreo Industrial

Puente bidireccional entre PLCs industriales y broker MQTT.

## Arquitectura

```
PLC (real o simulado) → Bridge → MQTT Broker (EMQX) → Suscriptores
```

## Componentes

| Componente | Descripción |
|------------|-------------|
| **Bridge** | Script Python que lee datos del PLC y los publica en MQTT |
| **EMQX** | Broker MQTT (Docker) |
| **Test Client** | Suscriptor de pruebas para observar datos |
| **Control Client** | Enviador de comandos START/STOP |

## Inicio Rápido

```bash
# 1. Iniciar broker MQTT
cd docker && docker compose up -d

# 2. Instalar dependencias
pip install -r bridge/requirements.txt

# 3. Iniciar bridge
python bridge/main.py

# 4. En otra terminal: activar realtime
python bridge/control_client.py START

# 5. Observar datos
python bridge/test_client.py
```

## Documentación

- [Bridge README](bridge/README.md) - Documentación completa del bridge
- [AGENTS.md](AGENTS.md) - Documentación de desarrollo

## Estructura

```
monitoreoIndustrial/
├── docker/           # Configuración EMQX
├── bridge/          # Scripts del bridge
├── README.md       # Este archivo
└── AGENTS.md       # Documentación de desarrollo
```