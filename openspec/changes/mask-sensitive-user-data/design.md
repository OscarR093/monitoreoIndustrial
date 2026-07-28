## Context

Actualmente `GET /api/auth/me` y `GET /api/auth/users` devuelven los DTO de usuario completos, incluyendo email y teléfono en texto plano. El frontend muestra estos valores directamente en `Settings.jsx` (perfil propio) y `UserManagement.jsx` (tabla de usuarios). No existe ninguna capa de protección de datos sensibles a nivel de API.

**Constraints:**
- Stack: .NET 10, React 19, JWT httpOnly cookie
- Roles: SuperAdmin, Admin, Viewer
- `GET /api/auth/users` solo accesible por Admin y SuperAdmin
- El usuario dueño del perfil siempre debe ver sus datos reales (para editar en Settings)

## Goals / Non-Goals

**Goals:**
- Enmascarar email y teléfono en respuestas de API cuando el solicitante no es el dueño del perfil ni SuperAdmin
- Proveer un endpoint para revelar un campo individual con autenticación
- El frontend muestra datos enmascarados con toggle de visibilidad

**Non-Goals:**
- No se modifica la base de datos (los datos se almacenan sin cambios)
- No se modifica el formulario de perfil propio (Settings)
- No se enmascaran otros campos (nombre, username, rol)
- No se implementa cifrado a nivel de base de datos

## Decisions

**1. Masking en el backend, no en el frontend**
- **Decisión:** El servidor decide qué enmascarar según el rol del JWT. El frontend muestra lo que recibe.
- **Alternativa rechazada:** Enmascarar en el frontend con JavaScript. No protege contra Network tab ni MITM. El dato real viaja por el cable aunque se oculte en pantalla.
- **Rationale:** La defensa real está en la capa de transporte (TLS) + capa de aplicación (API). El frontend solo recibe datos ya filtrados.

**2. Helper estático `MaskSensitiveData` en un archivo nuevo**
- **Decisión:** Un método estático que recibe email/teléfono y rol, devuelve el valor original o enmascarado.
- **Alternativa rechazada:** Lógica inline en el controller. Dificulta testing y reutilización.
- **Rationale:** Separación clara, testeable unitariamente, reutilizable si se agregan más endpoints.

**3. Formato de masking: primera letra + `***` + sufijo parcial**
- Email: `juan@empresa.com` → `j***@e****.com`
- Teléfono: `+52 123 456 7890` → `+52 *** 7890`
- **Alternativa rechazada:** `****@****.***` completo. Pierde contexto útil para identificar visualmente a quién pertenece.
- **Rationale:** Balance entre privacidad y reconocimiento. Un Admin viendo la tabla puede distinguir usuarios sin ver el dato completo.

**4. Endpoint de revelado: `GET /api/auth/users/{id}/reveal?field={email|telefono}`**
- **Decisión:** Endpoint dedicado que requiere autenticación Admin+. Devuelve `{ "value": "juan@empresa.com" }`.
- **Alternativa rechazada:** Query param `?unmask=true` en el endpoint existente. Mezcla responsabilidades y hace el caching impredecible.
- **Rationale:** Auditoría futura: cada revelación puede loguearse. Separación de concerns. El Admin paga el costo de una request extra solo cuando necesita ver.

**5. Sin cambios en el modelo de datos**
- **Decisión:** `Usuario` en `AppDbContext` mantiene los campos sin modificar. El masking es solo en la capa de presentación (controller/DTO).
- **Rationale:** Cero migración de base de datos. Rollback trivial: quitar la llamada al helper.

## Risks / Trade-offs

- **[Riesgo] Admin legítimo no puede ver emails en la tabla habitual** → Mitigación: toggle "Mostrar" con re-consulta en frontend. El Admin sigue teniendo acceso, solo requiere un clic extra.
- **[Riesgo] Formato de masking podría filtrar información si el email es muy corto** (ej: `a@b.co` → `a***@b**.co` no oculta suficiente) → Mitigación: para emails con parte local ≤2 caracteres, enmascarar completamente: `***@b**.co`.
- **[Trade-off] Una request extra por campo revelado** → Aceptable. El caso de uso es ocasional (el Admin no revisa emails todo el día). Si se vuelve frecuente, se puede agregar batch reveal.

## Migration Plan

1. Crear `api/Helpers/DataMasker.cs` con el helper estático
2. Modificar `AuthController.cs` en los métodos `Me()` y `Users()` para aplicar masking
3. Agregar endpoint `RevealField()` en `AuthController.cs`
4. Agregar `api.revealField(userId, field)` en `frontend/src/services/api.js`
5. Modificar `UserManagement.jsx` para usar toggle de visibilidad
6. Test manual: SuperAdmin ve todo, Admin ve masked, Viewer no accede a /users

**Rollback:** Revertir los cambios en `AuthController.cs` (quitar llamadas al helper). El helper puede quedarse sin causar daño.

## Open Questions

- ¿Agregar log de auditoría cuando un Admin revela un campo? (Posible feature futura, no en este change)
