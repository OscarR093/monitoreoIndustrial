# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El sistema sirve a tres roles que comparten la misma superficie pero con permisos distintos:

- **Operadores de planta**: monitorean equipos en tiempo real, detectan anomalías visuales (LEDs, alarmas, tendencias) y reaccionan ante eventos. Usan el dashboard como herramienta principal de awareness situacional.
- **Ingenieros de mantenimiento**: analizan históricos, revisan transiciones de estado y acumulados de contadores para planificar intervenciones. Configuran sensores, alarmas y unidades. Administran usuarios Viewer.
- **Gerentes/SuperAdmin**: gestionan la infraestructura del sistema (plantas, áreas, usuarios). Crean cuentas Admin y tienen acceso de configuración total.

El contexto de uso es una estación fija (escritorio/pantalla grande en sala de control u oficina técnica), no un dispositivo móvil.

## Product Purpose

Sistema de monitoreo industrial que recolecta datos de PLCs (reales o simulados), los transporta vía MQTT a una API central, y los presenta en un dashboard web con actualización en tiempo real vía WebSocket. Permite visualizar sensores analógicos (temperatura, presión, etc.), digitales de estado (ON/OFF de motores, válvulas) y digitales de contador (producción acumulada). Incluye configuración de alarmas con notificaciones por Telegram y correo electrónico.

El éxito se mide en que un operador pueda detectar una anomalía en menos de 10 segundos y un ingeniero pueda analizar el histórico de cualquier sensor sin salir del dashboard.

## Positioning

A diferencia de SCADAs industriales cerrados y de alto costo, este sistema es autocontenido, desplegable en intranet o cloud, con un stack moderno (React + .NET + MQTT) que cualquier equipo de desarrollo puede extender. La simulación integrada en el bridge permite demostrar y probar el sistema completo sin hardware real.

## Operating Context

- El bridge corre en la misma red que los PLCs (o simula sus datos).
- La API y el frontend pueden correr on-premise (intranet, sin TLS) o en cloud (con Traefik + Let's Encrypt + HTTPS/WSS/MQTTS).
- El dashboard se consulta desde navegadores de escritorio en la red local o a través del dominio cloud.
- Las notificaciones de alarma se despachan por Telegram y SMTP con rate limiting de 5 minutos.

## Capabilities and Constraints

**Capabilities confirmadas:**
- Conexión a PLCs reales vía Modbus TCP o simulación completa sin hardware.
- Transporte MQTT con topics `industrial/{planta}/{area}/history` y `industrial/{planta}/{area}/realtime`.
- Control START/STOP automático del flujo realtime según presencia de clientes WebSocket.
- Dashboard con tres tipos de visualización de sensores: analógico (línea/gauge/barra), digital estado (LED ON/OFF), digital contador (barras diarias + acumulado).
- Modal de detalle por sensor con estadísticas, historial con selector de fechas, y configuración de tipo de gráfico, unidad y alarmas.
- CRUD de plantas, áreas y sensores con alias editables (nombre técnico + nombre amigable).
- Unidades de medida personalizables con validación de uso.
- Autenticación JWT httpOnly cookie con tres roles (SuperAdmin, Admin, Viewer).
- Perfil de usuario con flujo de primer inicio de sesión (completar perfil obligatorio).
- Alarmas configurables por sensor con rangos min/max (analógicos y contadores) y disparo en ON/OFF (digitales estado).
- Datos históricos con agregación diaria para contadores.

**Restricciones técnicas:**
- Backend: .NET 10, PostgreSQL, Entity Framework Core, MQTTnet 5.x.
- Frontend: React 19, Vite 8, Tailwind CSS 4, Recharts, Lucide React.
- Bridge: Python con cliente MQTT (paho-mqtt).
- Broker MQTT: EMQX.
- Infraestructura: Docker Compose.

**No definido aún:**
- Nombre comercial del producto. "Monitoreo Industrial" es descriptivo, no una marca.
- Industria objetivo específica (aplica a cualquier entorno con PLCs y sensores industriales).

## Brand Commitments

No existen compromisos de marca vinculantes. No hay logo, paleta corporativa, tipografía propietaria ni guía de estilo. La identidad visual actual (tema oscuro ciber-industrial con cyan, verde, ámbar y rojo) es funcional y puede evolucionar o reemplazarse.

## Evidence on Hand

- Código completo del sistema (API .NET, Bridge Python, Frontend React) en este repositorio.
- Suite de tests xUnit (47 tests) para la API.
- Tests E2E con Playwright para el frontend.
- Documentación de arquitectura y endpoints en `AGENTS.md`.
- No hay estudios de usuario, métricas de uso real, testimonios ni casos de estudio.

## Product Principles

1. **Visibilidad inmediata**: un operador debe entender el estado del sistema de un vistazo, sin navegar ni interpretar.
2. **Profundidad progresiva**: el dashboard muestra lo esencial; el modal entrega análisis detallado sin salir del contexto.
3. **Autonomía técnica**: el sistema funciona completo con simulación, sin depender de hardware externo para desarrollo y pruebas.
4. **Configurabilidad sin código**: cambiar un alias, una unidad, un tipo de gráfico o una alarma no requiere tocar código ni reiniciar servicios.
5. **Modo de despliegue dual**: misma base de código para intranet (simple, sin TLS) y cloud (seguro, con dominio propio y certificados).

## Accessibility & Inclusion

No se han establecido requisitos específicos de accesibilidad. El sistema hereda las capacidades básicas del navegador (zoom, contraste de texto, navegación por teclado donde los componentes nativos lo soportan).
