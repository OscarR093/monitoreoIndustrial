---
name: Monitoreo Industrial
description: Dashboard industrial de supervisión en tiempo real para salas de control
colors:
  fondo-principal: "#080C0A"
  superficie: "#111714"
  acento-primario: "#F59E0B"
  estado-normal: "#22C55E"
  advertencia: "#EA580C"
  estado-critico: "#DC2626"
  linea-divisoria: "#1A1F1C"
  texto-secundario: "#787C7A"
typography:
  datos:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
    fontWeight: 700
  interfaz:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, Noto Sans, sans-serif"
    fontWeight: 400
rounded:
  borde-preciso: "4px"
  borde-estandar: "8px"
  borde-amplio: "12px"
  borde-circular: "9999px"
spacing:
  micro: "4px"
  compacto: "8px"
  estandar: "12px"
  generoso: "16px"
  amplio: "24px"
  pagina: "32px"
components:
  boton-primario:
    backgroundColor: "{colors.acento-primario}"
    textColor: "{colors.fondo-principal}"
    rounded: "{rounded.borde-estandar}"
    padding: "8px 16px"
  boton-primario-inactivo:
    backgroundColor: "oklch(80% 0.12 190 / 0.20)"
    textColor: "{colors.acento-primario}"
    rounded: "{rounded.borde-estandar}"
    padding: "8px 16px"
  tarjeta-sensor:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.borde-estandar}"
    padding: "16px"
  campo-texto:
    backgroundColor: "{colors.fondo-principal}"
    textColor: "white"
    rounded: "{rounded.borde-preciso}"
    padding: "4px 8px"
  campo-texto-autenticacion:
    backgroundColor: "{colors.fondo-principal}"
    textColor: "white"
    rounded: "{rounded.borde-estandar}"
    padding: "8px 12px"
---

# Design System: Monitoreo Industrial

## Overview

**Creative North Star: "La Sala de Control"**

El dashboard encarna la precisión y legibilidad absoluta de una sala de control industrial. Cada pixel tiene un propósito; nada es decorativo. La interfaz sigue una jerarquía de información militar donde los datos críticos compiten por atención solo cuando es necesario. El estado normal del sistema se transmite con silencio visual (verde, estable, sin alarmas); la excepción (rojo, ámbar) irrumpe con autoridad pero sin histrionismo.

La filosofía visual se apoya en tres pilares: capas tonales sin sombras para construir profundidad, componentes con la precisión táctil de instrumentos de panel, y una paleta donde el verde domina porque el sistema está, por defecto, bajo control. La tensión visual no es el estado base: es una señal que aparece solo cuando algo requiere acción.

Se rechaza explícitamente el "ciberpunk decorativo" (glows neón, scanlines, efectos de CRT). Se rechazan las sombras como mecanismo de elevación. Se rechazan las animaciones gratuitas que no comunican cambio de estado. La paleta se inspira en la instrumentación industrial clásica: ámbar de display, verde de LED de panel, rojo de piloto de fallo.

**Key Characteristics:**
- Legibilidad absoluta: todo texto de datos en monospace, toda etiqueta de interfaz en sans-serif
- Profundidad por capas tonales, no por sombras
- Paleta de 8 colores donde el verde señala normalidad y el rojo es excepción
- Componentes con respuesta instantánea (150ms), sin animaciones superfluas
- Densidad de información alta, espacios generosos solo entre zonas lógicas

## Colors

La paleta sigue un modelo de rol funcional: cada color existe porque responde una pregunta del operador ("¿Está bien?", "¿Hay peligro?", "¿Dónde hago clic?"). No hay colores decorativos.

### Primary
- **Acento Primario** (`#F59E0B`): El ámbar de la instrumentación clásica. Color de display de osciloscopios, multímetros Fluke, paneles Tektronix. Se usa en botones principales, enlaces activos, bordes de foco, indicadores de loading, y para señalar interactividad. Aparece en el logo SCADA del header y sidebar. Su calidez contrasta con los fondos fríos sin resultar agresivo. Nunca se usa en valores de sensor.

### Secondary
No existe un acento secundario. El sistema opera con un solo color de acción para eliminar ambigüedad: si es ámbar, es interactivo o está seleccionado.

### Neutral
- **Fondo Principal** (`#080C0A`): Casi negro con un subtono cálido imperceptible. Fondo de página, fondo de inputs, fondo de gráficos. No es un negro puro — tiene personalidad de gabinete industrial.
- **Superficie** (`#111714`): Un paso arriba en luminosidad, con el mismo subtono cálido. Fondo de tarjetas, header, sidebar, modales. La diferencia tonal con Fondo Principal es el único mecanismo de elevación del sistema.
- **Línea Divisoria** (`#1A1F1C`): Color de todos los bordes y divisores. Más claro que Superficie, más oscuro que cualquier contenido. Subtono cálido consistente con la familia.
- **Texto Secundario** (`#787C7A`): Texto de baja prioridad: etiquetas, placeholders, metadatos, timestamps, identificadores técnicos. Gris medio con subtono cálido. Nunca se usa para valores de sensor ni para acciones.

### Semantic
- **Estado Normal** (`#22C55E`): Verde militar. Señal de "todo correcto". Conexión activa, sensor en rango, motor encendido sin falla. No es un verde brillante — es el verde de un LED de panel de control: visible pero sobrio. Es el color dominante del dashboard porque el estado base del sistema es la normalidad.
- **Advertencia** (`#EA580C`): Naranja intenso, distinto del ámbar del acento. Señal de "prestar atención". Reconexión en curso, valor cercano al límite, alarma no crítica. Transitorio: debe resolverse a verde o escalar a rojo.
- **Estado Crítico** (`#DC2626`): Rojo apagado, sin saturación excesiva. Señal de "actuar ahora". Desconexión, valor fuera de rango, falla confirmada. Su rareza es su fuerza: un dashboard donde el rojo es frecuente ha perdido su capacidad de alertar. No es un rojo brillante de alerta — es el rojo de un piloto de fallo en un tablero industrial.

### Named Rules
**La Regla del Silencio Visual.** El verde debe dominar la superficie visible. Si en cualquier vista el naranja o el rojo ocupan más del 15% del área, el diseño está fallando: o hay demasiadas alarmas falsas o la jerarquía visual no está funcionando.

**La Regla del Acento Único.** Solo el Acento Primario (ámbar) indica interactividad o selección. Ningún otro color debe usarse para bordes de foco, hover states, o indicadores de "activo". El naranja de Advertencia es semánticamente distinto — señala estado del sistema, no interacción.

## Typography

**Datos:** ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
**Interfaz:** ui-sans-serif, system-ui, -apple-system, sans-serif
**Carácter:** La división es absoluta y funcional. Monospace para todo lo que es un dato (valores, identificadores, timestamps, unidades técnicas). Sans-serif para todo lo que es interfaz (etiquetas, botones, navegación, títulos de sección). Esta separación permite al operador distinguir instantáneamente entre "lo que el sistema me dice" y "lo que yo le digo al sistema".

### Hierarchy
- **Valor Principal** (bold, 28px–32px, 1.2): El número que define la tarjeta del sensor. Es lo primero que el ojo busca. 32px para contadores, 28px para analógicos.
- **Título de Página** (semibold, 20px–24px, 1.3): Login, CompleteProfile, UserManagement. Aparece una vez por vista.
- **Encabezado de Modal** (semibold, 18px, 1.3): Título del sensor en el modal de detalle.
- **Etiqueta de Sección** (semibold, 14px, 1.4): Títulos de zona ("Temperaturas", "Motores"), encabezados de formulario, ítems de navegación.
- **Cuerpo de Interfaz** (medium, 12px–14px, 1.5): Labels de campos, texto de botones, opciones de select, mensajes de error. Máximo 75 caracteres por línea en bloques de texto.
- **Metadato** (medium, 10px–11px, 1.4): Identificadores de sensor, unidades, timestamps, contadores de zona. Tracking wider (0.05em) en etiquetas de estado.
- **Marca** (black, 16px, tracking 0.15em–0.2em): El logotipo "SCADA" en header y sidebar. Es el único texto con tracking expandido como recurso de identidad.

### Named Rules
**La Regla de las Dos Voces.** Monospace = dato del sistema. Sans-serif = acción del usuario. Nunca se mezclan en un mismo elemento. Un valor de sensor jamás se muestra en sans-serif; una etiqueta de botón jamás se muestra en monospace.

## Layout

El layout sigue un modelo de panel de control físico: barra de estado superior, panel de navegación lateral, área de trabajo central con zonas colapsables.

**Estructura base:** flexbox horizontal a altura completa de viewport. Sidebar izquierdo (52px colapsado, 208px expandido) con borde derecho sutil. Área principal con scroll vertical independiente.

**Zonas:** el contenido se organiza en zonas colapsables con cabecera siempre visible. Cada zona contiene un grid responsivo de tarjetas (1 columna en móvil, 2 en sm, 3 en lg, 4 en xl).

**Selector de ubicación:** barra horizontal fija bajo el header, permite cambiar planta/área sin perder contexto de navegación.

**Modal:** overlay a pantalla completa, centrado, ancho máximo 672px, scroll interno si el contenido excede el viewport. El modal no navega: es una profundización del contexto actual.

**Espaciado rítmico:** todos los gaps y paddings siguen múltiplos de 4px. La densidad es alta en tarjetas (p-4, gap-1.5 entre elementos internos), media en secciones (gap-3 entre tarjetas), y baja entre zonas (mb-5 entre zonas colapsables).

## Elevation & Depth

**Filosofía de capas tonales sin sombras.** El sistema construye profundidad exclusivamente mediante diferencia de luminosidad entre fondos. La página usa el negro más profundo (Fondo Principal, `#0A0E14`). Las superficies elevadas (tarjetas, header, sidebar, modales) usan Superficie (`#131820`), un paso apenas perceptible de separación. No se usan sombras (box-shadow) en ningún componente.

Esta decisión elimina el "ruido de profundidad" que las sombras introducen en dashboards densos y asegura que el foco permanezca en los datos, no en la decoración espacial. La separación entre módulos se consigue con bordes finos (Línea Divisoria, 1px) y diferencia tonal.

### Named Rules
**La Regla del Relieve Ausente.** Ningún componente proyecta sombra. La elevación es diferencia de luminosidad entre Fondo Principal y Superficie, y nada más. Un diseñador que quiera añadir profundidad debe oscurecer o aclarar el fondo del elemento, nunca añadir box-shadow.

## Shapes

El sistema usa un lenguaje de formas derivado de paneles de instrumentos: predominantemente rectangular con esquinas redondeadas de radio controlado.

- **Borde Preciso (4px):** Inputs, selects, botones de ícono, ítems de navegación. La esquina apenas redondeada transmite precisión instrumental.
- **Borde Estándar (8px):** Tarjetas de sensor, contenedores de formulario, gráficos, cajas de error. El radio más usado.
- **Borde Amplio (12px):** Modal y tarjetas de autenticación. Solo en superficies que flotan sobre el contenido (overlay).
- **Borde Circular (9999px):** Badges de estado, indicadores LED, avatares de usuario, spinners de carga. Elementos que necesitan destacar como "puntos" en el layout.

Los bordes son siempre de 1px en Línea Divisoria, excepto en la barra lateral del header (2px en Acento Primario al 20%) y en el indicador de estados de la tarjeta (borde izquierdo de 4px en color semántico).

## Components

### Buttons

- **Forma:** Borde Estándar (8px), sin sombra.
- **Primario:** Fondo Acento Primario sólido, texto Fondo Principal, padding 8px 16px. Uso restringido a la acción principal de cada vista (login, guardar configuración, crear usuario).
- **Primario inactivo (default):** Fondo Acento Primario al 20%, texto Acento Primario, borde Acento Primario al 30%. Para acciones secundarias.
- **Hover:** El primario sólido aclara al 90%. El primario inactivo sube la opacidad del fondo al 30%.
- **Focus:** Anillo de 1px en Acento Primario, sin offset.
- **Transición:** 150ms en background-color. Sin transformaciones de escala o elevación.
- **Ghost:** Sin fondo, texto Texto Secundario, hover cambia a blanco o al color semántico correspondiente (rojo para eliminar).
- **Disabled:** Opacidad al 50% en todo el botón.

### Cards / Sensor

- **Forma:** Borde Estándar (8px) en las cuatro esquinas. Barra de estado en el borde inferior (0.5px de altura, color semántico, bordes inferiores redondeados). Borde izquierdo de 4px en color semántico.
- **Fondo:** Superficie (`#111714`), borde de 1px en Línea Divisoria.
- **Profundidad:** Sin sombra. La tarjeta se distingue del fondo de página solo por su color Superficie y su borde.
- **Padding interno:** 16px uniforme.
- **Altura mínima:** 260px para mantener consistencia en el grid.
- **Hover:** El borde cambia a Acento Primario al 30%. Sin elevación, sin escala. Transición de 150ms en border-color.
- **Estados de borde izquierdo:** Verde (Estado Normal) por defecto, Naranja (Advertencia) si hay alarma activa no crítica.

### Inputs / Fields

- **Estándar:** Fondo Fondo Principal, borde 1px Línea Divisoria, Borde Preciso (4px), padding 4px 8px, texto 12px blanco, placeholder Texto Secundario.
- **Autenticación:** Igual que el estándar pero con Borde Estándar (8px), padding 8px 12px, texto 14px, y anillo de foco de 1px.
- **Focus:** Borde cambia a Acento Primario. La variante de autenticación añade un anillo de 1px en Acento Primario.
- **Error:** Borde cambia a Estado Crítico. Sin anillo adicional.
- **Select:** Idéntico al input estándar. Fondo transparente en el selector de ubicación.
- **Checkbox:** Acento Primario como color de acento nativo.

### Navigation

- **Sidebar:** Panel vertical izquierdo, fondo Superficie, borde derecho de 2px en Acento Primario al 10%. Colapsable entre 52px (solo íconos) y 208px (íconos + etiquetas). Transición de 200ms en width.
- **Ítem activo:** Fondo Acento Primario al 10%, texto Acento Primario, borde izquierdo de 2px en Acento Primario sólido.
- **Ítem inactivo:** Texto Texto Secundario, borde izquierdo transparente. Hover: fondo Fondo Principal, texto blanco.
- **Header:** Barra horizontal fija, fondo Superficie, borde inferior de 2px en Acento Primario al 20%. Contiene: logo SCADA (monospace, black, 16px, tracking 0.2em), indicador de conexión WebSocket, timestamp.
- **Selector de ubicación:** Barra secundaria bajo el header, fondo Superficie, borde inferior 1px en Línea Divisoria. Contiene selects de planta/área y timestamp.

### Chips / Badges

- **Badge de estado:** Borde Circular, padding 4px 12px, texto 10px uppercase tracking wider. Fondo al 10% del color semántico, texto en color semántico sólido, borde 1px al 30%.
- **Indicador LED:** Círculo de 12px con borde de 4px. ON: borde Estado Normal, fondo Estado Normal al 20%. OFF: borde Línea Divisoria, fondo Línea Divisoria al 20%.
- **Pill de rol:** Borde Circular, padding 2px 8px, texto 12px. SuperAdmin: púrpura (#a855f7). Admin: Acento Primario. Viewer: Texto Secundario.

### Modal

- **Overlay:** Fijo, pantalla completa, fondo negro al 70%. Sin blur.
- **Contenedor:** Ancho máximo 672px, altura máxima 90vh, scroll vertical interno. Fondo Superficie, Borde Amplio (12px), borde 1px Línea Divisoria, padding 24px. Sin sombra.
- **Cabecera:** Nombre del sensor + botón de cierre (ícono X, 20px, Texto Secundario, hover blanco).
- **Grid de estadísticas:** 3 columnas, gap 12px. Cada celda: fondo Fondo Principal, Borde Estándar, padding 12px.
- **Secciones de formulario:** padding 16px, fondo Superficie (sin borde adicional).
- **Gráfico de historial:** Fondo Fondo Principal, Borde Estándar, padding 8px, altura 192px.

### Loading

- **Spinner:** Borde Circular, borde 2px Acento Primario con borde superior transparente. Animación spin lineal infinita. Tamaños: 32px (página completa), 24px (inline).
- **Skeleton:** Placeholder rectangular con fondo Línea Divisoria al 50% y animación pulse. Usado en gráficos mientras cargan datos.

## Do's and Don'ts

### Do:
- **Do** usar monospace para todo valor de sensor, identificador técnico, timestamp y unidad de medida.
- **Do** usar sans-serif para toda etiqueta de interfaz, botón, título y texto de navegación.
- **Do** construir profundidad exclusivamente con capas tonales: Fondo Principal detrás, Superficie delante.
- **Do** usar el Acento Primario (ámbar) solo para elementos interactivos, seleccionados o en foco.
- **Do** mantener transiciones en 150ms; 200ms solo para cambios de layout (sidebar).
- **Do** usar tracking wider (0.05em) en etiquetas de estado, badges y metadatos.
- **Do** preferir el silencio visual: si un dashboard tiene más de 15% de área en naranja o rojo, revisar las alarmas.

### Don't:
- **Don't** usar sombras (box-shadow) en ningún componente. La elevación es solo diferencia tonal.
- **Don't** mezclar monospace y sans-serif en un mismo elemento de texto.
- **Don't** usar más de 8 colores en toda la interfaz (los 8 tokens definidos en Colors).
- **Don't** añadir animaciones que no comuniquen un cambio de estado.
- **Don't** usar el Acento Primario para valores de sensor o datos; solo para interfaz interactiva.
- **Don't** usar bordes redondeados mayores a 12px fuera de modales y tarjetas de autenticación.
- **Don't** mostrar texto de datos a menos de 10px; la legibilidad en sala de control es prioridad absoluta.
- **Don't** usar gradientes como fondo de componentes. Los gradientes solo existen dentro de gráficos Recharts.
