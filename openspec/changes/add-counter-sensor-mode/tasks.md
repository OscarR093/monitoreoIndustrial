## 1. Modelo de datos y migración

- [x] 1.1 Agregar `ModoDigital` (string?, nullable) a Sensor.cs
- [x] 1.2 Agregar `modo` (string, default "estado") a DatoSensorMessage
- [x] 1.3 Crear migración EF: columna `ModoDigital` varchar(20) nullable en Sensores, UPDATE `ModoDigital='estado'` WHERE `TipoDato='digital'`
- [x] 1.4 Seed: TipoGrafico id=5 ("Contador", widget="counter"), Unidad id=8 ("Unidades", símbolo="ud")

## 2. Bridge (Python)

- [x] 2.1 Agregar campo `modo` a cada sensor en sensors.py (d1/d2="estado", nuevo c1="contador")
- [x] 2.2 Implementar lógica de contador en plc_simulation.py: inicializar en 1000-5000, incrementar 0-3 por tick, nunca decrecer, acumular cambios entre history
- [x] 2.3 Incluir `modo` en el dict de datos generado por leer_datos() y leer_history()

## 3. API: Controladores y servicios

- [x] 3.1 SensoresController PUT: validar ModoDigital (analogico→null, digital→"estado"|"contador"). Validar coherencia de alarmas (contador→AlarmaEnOn/Off=false, estado→rangos=null)
- [x] 3.2 MqttSubscriberService.GuardarDatoSensorAsync: auto-crear sensor contador con TipoGraficoId=5, UnidadId=8, ModoDigital="contador". Usar default modo="estado" si campo ausente
- [x] 3.3 DatosController GET: soportar parámetro `agregar=diario`. Para sensores contador, devolver `{ raw: [...], diario: [{dia, total}] }` haciendo SUM(Cambios) agrupado por día
- [x] 3.4 AlarmService.VerificarAsync: rama contador (ModoDigital="contador") usa VerificarAnalogico() con RangoMinimo/RangoMaximo, ignora AlarmaEnOn/AlarmaEnOff

## 4. Frontend

- [x] 4.1 Crear componente CounterWidget: número grande formateado con unidad, delta "hoy", reemplaza DigitalIndicator para contadores
- [x] 4.2 Actualizar SensorCard: rama ModoDigital="contador" → renderiza CounterWidget, muestra valor acumulado, aplica status por rangos
- [x] 4.3 Actualizar SensorDetailModal: rama contador → gráfica de línea (1 día) o barras diarias (>1 día), sección alarmas con RangoMinimo/RangoMaximo en vez de checkboxes ON/OFF
- [x] 4.4 Actualizar Dashboard alertCount: contadores evalúan RangoMinimo/RangoMaximo en vez de AlarmaEnOn/AlarmaEnOff
- [x] 4.5 Actualizar api.js: función fetch con soporte para parámetro `agregar` en GET /api/datos
- [x] 4.6 Actualizar sensorZones.js: sensores con unidad "ud" a zona "Contadores"

## 5. Verificación

- [x] 5.1 Ejecutar migración y verificar que columna ModoDigital existe, digitales existentes tienen "estado", seed data existe
- [ ] 5.2 Ejecutar bridge con simulación, verificar que MQTT incluye `modo` y contador se auto-crea con widget counter
- [ ] 5.3 Abrir frontend, verificar contador visible con valor acumulado, abrir modal y verificar barras diarias
- [x] 5.4 Ejecutar tests xUnit existentes: `cd api.Tests && dotnet test`
