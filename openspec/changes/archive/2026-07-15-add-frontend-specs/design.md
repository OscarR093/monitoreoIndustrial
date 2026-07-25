## Context

El frontend actual usa React 19, Vite 8, Tailwind CSS 4 y Recharts. El layout es sidebar + main genérico, los sensores se muestran como tarjetas simples sin gráficos, y los emojis decoran la navegación. El producto es un sistema de monitoreo industrial para fábricas donde operadores necesitan conciencia situacional inmediata.

## Goals / Non-Goals

**Goals:**
- Layout de 3 zonas (top bar con estado + sidebar fina colapsable + main con grid de zonas)
- Gráficos Recharts embebidos en cada tarjeta según `TipoGraficoId`
- Iconos lucide-react reemplazando todos los emojis
- Agrupación de sensores en zonas colapsables con persistencia
- Tema visual industrial SCADA/HMI deliberado, no genérico SaaS

**Non-Goals:**
- Panel de detalle de sensor con gráfico histórico completo (futuro)
- Umbrales de alerta configurables por usuario (futuro)
- Modo claro/oscuro toggle (futuro)
- Exportación de datos (futuro)
- Fullscreen/kiosk mode (futuro)

## Decisions

### D1: lucide-react como librería de iconos

**Decisión**: lucide-react (tree-shakeable, 1800+ iconos, peso mínimo).

**Alternativa considerada**: phosphor-react. Rechazada por mayor peso de bundle (6 estilos vs 1).

**Rationale**: lucide-react permite importar solo los iconos usados sin inflar el bundle (regla vercel `bundle-barrel-imports`). Mapeo semántico centralizado en `icons.js`.

### D2: Recharts para mini-charts en tarjetas

**Decisión**: Cada tarjeta renderiza un componente Recharts según `tipoGraficoId`: `<LineChart>` (1), `<PieChart>` donut (2), `<BarChart>` (3).

**Alternativa considerada**: Chart.js + react-chartjs-2. Rechazada por mayor peso y API menos React-idiomática.

**Rationale**: Recharts ya está instalado. Los mini-charts son compactos (100x60px approx), sin ejes visibles, solo la forma para percepción rápida.

### D3: Paleta SCADA en Tailwind extend

**Decisión**: Extender la config de Tailwind con colores industriales SCADA en vez de usar los slate/sky defaults.

```
cyber-black: #0A0E14    (fondo principal)
panel:       #131820     (superficies)
cyan-tech:   #00E5FF     (datos, acentos activos)
industrial: {
  green:     #00C853     (normal)
  amber:     #FF9100     (warning)
  red:       #FF1744     (critical)
}
gridline:    #1A2433     (separadores tipo bezel)
text-muted:  #78909C     (texto secundario)
```

**Alternativa considerada**: Mantener slate palette de Tailwind. Rechazada porque es uno de los 3 defaults de AI que la skill frontend-design advierte evitar.

**Rationale**: Paleta intencional inspirada en paneles HMI/SCADA. Diferencia el producto de cualquier dashboard SaaS genérico.

### D4: Zonas configurables vía objeto JS

**Decisión**: La agrupación de sensores en zonas se define en un objeto de configuración `sensorZones`, no en la BD.

**Alternativa considerada**: Endpoint de API para configuración de zonas guardada en DB. Rechazada para MVP porque añade complejidad sin beneficio inmediato.

**Rationale**: Un objeto JS simple que mapea `sensorId` o `tipoUnidad` a nombre de zona. Si se necesita persistencia multi-usuario, se migra a API después.

### D5: Persistencia de collapse en localStorage

**Decisión**: El estado colapsado de cada zona se guarda en `localStorage` con key por planta/área.

**Alternativa considerada**: Estado solo en memoria (se pierde al refrescar). Rechazada por mala UX en sala de control.

**Rationale**: Siguiendo la regla vercel `client-localstorage-schema`, se usa una clave versionada (`zones:p1:a1:v1`) y se minimiza el payload almacenado.

## Risks / Trade-offs

- **[Riesgo] Mini-charts con datos históricos requieren un fetch adicional** → actualmente el WebSocket solo envía el valor actual. Se necesitará un `GET /api/datos?sensorId=X&limit=20` al cargar cada tarjeta. → Mitigación: fetch en paralelo con `Promise.all`, los datos históricos no bloquean el valor en tiempo real.

- **[Trade-off] Zonas hardcodeadas en frontend** → si un cliente necesita personalizar zonas, requiere editar código fuente. Aceptable para <5 clientes con soporte directo.
