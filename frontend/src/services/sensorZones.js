const sensorZones = {
  default: 'General',
  groups: [
    {
      name: 'Temperaturas',
      match: (sensor) =>
        sensor.unidad?.nombre?.toLowerCase().includes('temperatura') ||
        sensor.unidad?.simbolo === '°C',
    },
    {
      name: 'Presiones',
      match: (sensor) =>
        sensor.unidad?.nombre?.toLowerCase().includes('presión') ||
        sensor.unidad?.simbolo === 'PSI',
    },
    {
      name: 'Eléctricos',
      match: (sensor) =>
        sensor.unidad?.nombre?.toLowerCase().includes('voltaje') ||
        sensor.unidad?.simbolo === 'V' ||
        sensor.unidad?.nombre?.toLowerCase().includes('corriente') ||
        sensor.unidad?.simbolo === 'A',
    },
    {
      name: 'Motores',
      match: (sensor) => sensor.unidad?.simbolo === 'RPM',
    },
    {
      name: 'Contadores',
      match: (sensor) =>
        sensor.unidad?.simbolo === 'ud' ||
        sensor.modoDigital === 'contador',
    },
  ],
};

export function getZoneForSensor(sensor) {
  for (const group of sensorZones.groups) {
    if (group.match(sensor)) return group.name;
  }
  return sensorZones.default;
}

export function groupSensorsByZone(sensores) {
  const zones = {};
  for (const group of sensorZones.groups) {
    zones[group.name] = [];
  }
  zones[sensorZones.default] = [];

  for (const sensor of sensores) {
    const zone = getZoneForSensor(sensor);
    if (!zones[zone]) zones[zone] = [];
    zones[zone].push(sensor);
  }

  return Object.fromEntries(
    Object.entries(zones).filter(([, v]) => v.length > 0)
  );
}

export default sensorZones;
