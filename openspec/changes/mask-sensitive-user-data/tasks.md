## 1. Backend: Data Masking Helper

- [x] 1.1 Crear `api/Helpers/DataMasker.cs` con método estático `MaskEmail(string email)` → `j***@e****.com`
- [ ] 1.2 Agregar método estático `MaskPhone(string phone)` → `+52 *** 7890`
- [ ] 1.3 Agregar método `Mask(string value, string field, string role, int? ownerUserId, int? currentUserId)` que decide si enmascarar o no
- [ ] 1.4 Manejar edge cases: email cortos (≤2 chars local part), null, vacío

## 2. Backend: AuthController Modifications

- [ ] 2.1 Modificar `GET /api/auth/me` — devolver datos reales (el usuario es dueño de su perfil)
- [ ] 2.2 Modificar `GET /api/auth/users` — aplicar masking para Admins, datos reales para SuperAdmin
- [ ] 2.3 Crear `GET /api/auth/users/{id}/reveal?field={email|telefono}` — devolver `{ "value": "..." }`
- [ ] 2.4 Validar que solo Admin+ puede acceder al reveal endpoint
- [ ] 2.5 Validar que `field` solo acepta `email` o `telefono` (400 si no)

## 3. Frontend: API Client

- [ ] 3.1 Agregar `revealField(userId, field)` en `frontend/src/services/api.js`
- [ ] 3.2 El método retorna `{ value: string }` o lanza error

## 4. Frontend: UserManagement Page

- [ ] 4.1 Detectar si el currentUser es Admin (no SuperAdmin) para mostrar toggle
- [ ] 4.2 Agregar botón "Mostrar" junto a email y teléfono cuando están enmascarados
- [ ] 4.3 Implementar toggle: "Mostrar" → llama a `revealField` → muestra valor real → cambia a "Ocultar"
- [ ] 4.4 "Ocultar" vuelve al valor enmascarado original sin nueva request
- [ ] 4.5 Manejar estado de carga en el botón de reveal

## 5. Verification

- [ ] 5.1 `dotnet build` en `api/` sin errores
- [ ] 5.2 `npm run build` en `frontend/` sin errores
- [ ] 5.3 Probar manual: SuperAdmin ve datos reales en /users
- [ ] 5.4 Probar manual: Admin ve datos enmascarados en /users con botón "Mostrar"
- [ ] 5.5 Probar manual: Viewer no puede acceder a /users (ya existe) ni al reveal endpoint
- [ ] 5.6 Probar manual: /settings muestra datos reales del perfil propio
