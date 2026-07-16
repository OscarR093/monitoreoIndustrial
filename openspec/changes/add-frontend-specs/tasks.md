## 1. Setup: Dependencias y Configuración

- [x] 1.1 Instalar `lucide-react` en el frontend
- [x] 1.2 Crear `frontend/src/services/icons.js` con mapeo centralizado de iconos
- [x] 1.3 Extender Tailwind config con paleta SCADA (cyber-black, panel, cyan-tech, industrial, gridline, text-muted)
- [x] 1.4 Crear `frontend/src/services/sensorZones.js` con configuración de zonas

## 2. Layout: Barra de Navegación Superior

- [x] 2.1 Crear `NavigationBar.jsx` con indicador de conexión WebSocket (Plug/PlugZap/WifiOff)
- [x] 2.2 Agregar contador de alertas (badge con `AlertTriangle`) — conteo de sensores en warning/critical
- [x] 2.3 Mover selector de planta/área a la barra superior
- [x] 2.4 Agregar timestamp del último dato recibido
- [x] 2.5 Agregar botones globales "Expandir Todo" / "Colapsar Todo"

## 3. Layout: Sidebar Rediseñada

- [x] 3.1 Rediseñar `AuthLayout.jsx` con sidebar fina colapsable usando lucide-react
- [x] 3.2 Agregar toggle de colapso con animación de transición
- [x] 3.3 Comportamiento responsive: colapso automático en <768px

## 4. Componentes: Tarjetas de Sensor con Gráficos

- [x] 4.1 Crear `SensorCard.jsx` con mini-chart Recharts según `tipoGraficoId`
- [x] 4.2 Implementar `<LineChart>` sparkline para tipoGraficoId=1
- [x] 4.3 Implementar donut gauge para tipoGraficoId=2
- [x] 4.4 Implementar `<BarChart>` para tipoGraficoId=3
- [x] 4.5 Agregar indicador de estado por color (green/amber/red) en borde izquierdo
- [x] 4.6 Agregar fetch de datos históricos al cargar tarjeta (`GET /api/datos?limit=20`)
- [x] 4.7 Estado "sin datos" con "--" y apariencia muted

## 5. Componentes: Zonas de Sensores

- [x] 5.1 Crear `SensorZone.jsx` con cabecera colapsable y grid interno de sensores
- [x] 5.2 Implementar toggle de colapso con `ChevronDown`/`ChevronRight`
- [x] 5.3 Persistencia de estado de colapso en localStorage (por planta/área)
- [x] 5.4 Zona "General" por defecto para sensores no asignados

## 6. Integración: Dashboard Principal

- [x] 6.1 Reemplazar `Dashboard.jsx` con el nuevo layout de 3 zonas
- [x] 6.2 Integrar NavigationBar + Sidebar + zonas de sensores en el nuevo layout
- [x] 6.3 Actualizar `AuthLayout.jsx` para nuevos componentes
- [x] 6.4 Eliminar selectores de planta/área del área de contenido (ya están en top bar)

## 7. Sistema de Iconos

- [x] 7.1 Reemplazar 📊 por `LayoutDashboard` en sidebar
- [x] 7.2 Reemplazar 👥 por `Users` en sidebar
- [x] 7.3 Reemplazar ⚠️ por `AlertTriangle` en alertas
- [x] 7.4 Reemplazar ⚙️ por `Settings` en configuración
- [x] 7.5 Agregar `Plug`/`WifiOff` para indicadores de conexión

## 8. Verificación

- [x] 8.1 Dashboard carga con las 3 zonas visibles
- [x] 8.2 Sidebar colapsa/expande con toggle
- [x] 8.3 Mini-charts se renderizan correctamente según tipoGraficoId
- [x] 8.4 Indicadores de estado cambian de color con valores
- [x] 8.5 Zonas colapsan/expanden y persisten en localStorage
- [x] 8.6 Barra superior muestra conexión, alertas, timestamp
- [x] 8.7 Selector planta/área funciona desde la barra superior
- [x] 8.8 Sin emojis en toda la UI
- [x] 8.9 Responsive: sidebar se colapsa en mobile
- [x] 8.10 Playwright tests existentes siguen pasando (login, dashboard, logout)
