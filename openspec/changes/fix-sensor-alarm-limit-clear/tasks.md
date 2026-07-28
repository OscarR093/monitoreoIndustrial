## 1. State sync

- [x] 1.1 Agregar `useEffect` en `SensorDetailModal` que sincroniza `sensor.rangoMinimo` → `rangoMin` y `sensor.rangoMaximo` → `rangoMax`

## 2. Post-save feedback

- [ ] 2.1 Agregar `showToast('Configuración guardada', 'success')` después de `handleSaveAlarm` exitoso

## 3. Clear button

- [ ] 3.1 Agregar botón "×" junto a cada input de rango (rangoMin, rangoMax) para limpiar explícitamente
- [ ] 3.2 El botón solo visible cuando el input tiene un valor (no vacío)

## 4. Verification

- [ ] 4.1 `npm run build` en frontend sin errores
