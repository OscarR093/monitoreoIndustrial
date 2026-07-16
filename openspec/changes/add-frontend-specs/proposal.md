## Why

El dashboard actual sigue un patrón de panel SaaS genérico (sidebar oscura + grid de tarjetas Tailwind) que no comunica el contexto industrial del producto. El frontend necesita una identidad visual propia de sala de control: barra de estado en tiempo real, tarjetas de sensor con gráficos embebidos, agrupación por zonas lógicas, e iconografía técnica. Las skills de diseño instaladas (frontend-design, kpi-dashboard-design, vercel-react) guían hacia una dirección SCADA/HMI deliberada en vez de defaults de AI.

## What Changes

- **Rediseño del layout**: Barra superior con estado en tiempo real + sidebar fina con navegación + panel principal con grid de sensores agrupado por zonas colapsables.
- **Tarjetas de sensor con gráficos**: Recharts embebido (línea, gauge, barra) según `TipoGraficoId` del sensor. Indicador de estado en el borde según valor vs umbrales.
- **Sistema de iconos**: lucide-react reemplaza todos los emojis (`LayoutDashboard`, `Users`, `Gauge`, `AlertTriangle`, `Thermometer`, `Settings`, `Plug`).
- **Barra de navegación informativa**: Estado de conexión WebSocket, conteo de sensores por estado, timestamp del último dato, selector de planta/área.
- **Zonas agrupables**: Los sensores se organizan en grupos lógicos (ej: "Temperaturas", "Presiones") con cabeceras colapsables.
- **Tema oscuro SCADA**: Paleta inspirada en paneles HMI industriales (cyan instrumental, verde/ámbar/rojo de estado, fondo profundo con matiz azul).
- **Responsive**: Sidebar colapsable, grid adaptativo, vistas compactas para móvil.

## Capabilities

### New Capabilities
- `dashboard-layout`: Estructura de 3 zonas (top bar, sidebar, main) con sidebar colapsable y responsive.
- `sensor-cards`: Tarjetas de sensor con mini-chart Recharts, indicador de estado por color, y click para detalle.
- `navigation-bar`: Barra superior con indicador de conexión, contador de alertas, selector de planta/área, reloj.
- `icon-system`: Reemplazo de emojis por lucide-react con mapeo semántico consistente.
- `sensor-zones`: Agrupación de sensores en zonas colapsables con cabeceras descriptivas.

### Modified Capabilities
<!-- Ninguno — todos son specs nuevos -->

## Impact

- **Frontend**: Reescritura completa de Dashboard.jsx, AuthLayout.jsx, y creación de nuevos componentes (SensorCard, SensorZone, NavigationBar, Sidebar)
- **Dependencias nuevas**: `lucide-react` reemplaza emojis. `recharts` ya instalado, se usa en tarjetas.
- **Estilos**: Tailwind CSS con paleta SCADA personalizada (colores personalizados en config)
- **API**: Sin cambios. Los datos ya vienen del backend.
