## 1. Tab navigation

- [ ] 1.1 Agregar estado `tab` (diagnostico/historial/configuracion) en SensorDetailModal
- [ ] 1.2 Renderizar barra de tabs con estilo consistente al de Settings
- [ ] 1.3 Mostrar tab "Configuración" solo para Admin

## 2. Tab Diagnóstico

- [ ] 2.1 Mostrar valor actual grande con unidad, color según estado (normal/warning)
- [ ] 2.2 Stats: Actual, Mín/Máx, Promedio, cantidad de datos en el período
- [ ] 2.3 Indicador visual de estado de alarma (activa/inactiva + rangos configurados)

## 3. Tab Historial

- [ ] 3.1 Date pickers Desde/Hasta al inicio de la sección
- [ ] 3.2 Gráfico enriquecido: Y-axis labels visibles, gridlines, tooltip en hover
- [ ] 3.3 Tabla literal debajo del gráfico: timestamp | valor (scrollable, últimas ~50 filas)
- [ ] 3.4 Tabla usa displayHistory (ya cargado) — sin request extra

## 4. Tab Configuración (Admin)

- [ ] 4.1 Sección de alarma (checkboxes, rangos con botón ×, confirmación)
- [ ] 4.2 Sección Tipo y unidad (dropdowns, + Nueva unidad)
- [ ] 4.3 Botón "Guardar configuración"

## 5. Verification

- [ ] 5.1 `npm run build` sin errores
