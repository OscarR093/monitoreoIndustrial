export function getSensorDisplayName(sensor) {
  return sensor?.alias?.trim() || sensor?.sensorId || sensor?.nombre || 'Sensor';
}

export function getSensorIdentifier(sensor) {
  return sensor?.sensorId || sensor?.nombre || '—';
}

export function getAreaDisplayName(area) {
  return area?.alias?.trim() || area?.nombre || area?.codigo || 'Área';
}

export function getAreaIdentifier(area) {
  return area?.codigo || area?.nombre || '—';
}

export function getPlantaDisplayName(planta) {
  return planta?.alias?.trim() || planta?.nombre || planta?.codigo || 'Planta';
}
