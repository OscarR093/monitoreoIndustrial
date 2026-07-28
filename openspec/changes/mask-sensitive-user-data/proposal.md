## Why

Los endpoints `GET /api/auth/me` y `GET /api/auth/users` devuelven email y teléfono en texto plano. Cualquier persona con acceso al navegador (Network tab, consola) o un proxy de red puede leer estos datos. En un entorno industrial con múltiples roles y pantallas compartidas en sala de control, esto expone información personal de los operadores innecesariamente.

## What Changes

- **Backend:** La API aplica enmascaramiento de email y teléfono en las respuestas de `/api/auth/me` y `/api/auth/users`, excepto cuando el usuario consulta su propio perfil o el rol es SuperAdmin.
- **Frontend:** La UI muestra los valores enmascarados tal como los recibe del servidor. Los campos de email y teléfono en el formulario de perfil muestran el valor real durante edición (porque `/api/auth/me` para el propio usuario devuelve datos reales). En UserManagement, los Admins ven datos enmascarados; SuperAdmin ve datos reales.
- **Toggle de visibilidad:** En UserManagement, un botón "Mostrar" permite a Admins revelar temporalmente un campo con una re-consulta autenticada que devuelve el valor real.

## Capabilities

### New Capabilities
- `data-masking`: Enmascaramiento de campos sensibles (email, teléfono) en respuestas de API según rol del solicitante.
- `masked-fields-ui`: Visualización de campos enmascarados en el frontend con toggle de revelado para Admins.

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- `api/Controllers/AuthController.cs` — endpoints `Me`, `Users` (aplicar masking según rol)
- `api/Models/Dtos.cs` — posible extensión de UserDto con flags de masking
- `frontend/src/pages/UserManagement.jsx` — mostrar datos enmascarados + toggle "Mostrar"
- `frontend/src/services/api.js` — endpoint para revelar campo individual
