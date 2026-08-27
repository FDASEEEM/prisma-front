# Auditoría de código — prisma-front

**Rama analizada:** `develop` (más actualizada que `main`/`feat/real-dashboard-data` al momento del análisis)
**Fecha:** 2026-08-26
**Alcance:** seguridad, código muerto, código redundante/innecesario, dependencias.

Los hallazgos están ordenados de **más crítico a menos crítico**. Cada uno incluye archivo/línea, por qué importa, y una recomendación concreta.

---

## 🔴 Alto

### 1. JWT expuesto en logs del proxy vía SSE
- **Dónde:** `src/pages/SesionPage.jsx:167`, `src/context/ActiveSessionContext.jsx:48`, `nginx.conf.template` (`location /chat/`)
- **Qué pasa:** el `EventSource` nativo no soporta headers custom, así que el JWT viaja como `?token=<jwt>` en la URL. El `location /chat/` de nginx no desactiva `access_log`, así que **cada conexión y reconexión SSE deja el token en texto plano** en los logs del proxy (CloudWatch, ELK, o donde sea que se centralicen).
- **Impacto:** cualquiera con acceso a esos logs (ops, un log shipper mal configurado, una retención larga) puede tomar tokens de sesión activos.
- **Nota:** el propio CLAUDE.md ya advierte "cualquier proxy/CDN intermedio debe evitar loguear esas URLs", pero la mitigación nunca se implementó en `nginx.conf.template` — es un hallazgo real, no solo teórico.
- **Fix recomendado:** agregar `access_log off;` (o un `log_format` que excluya `$request`) en el `location /chat/` de `nginx.conf.template`, ya que esa location ya redeclara sus propios headers.

---

## 🟠 Medio-Alto

### 2. Cero security headers en la respuesta de la SPA
- **Dónde:** `nginx.conf.template`
- **Qué pasa:** no hay `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy` ni `Strict-Transport-Security`.
- **Impacto:** el JWT vive en `localStorage` (`src/utils/localStorage.js`), así que un XSS futuro (aunque hoy no se encontró ninguno) se traduce directo en robo de sesión sin ninguna barrera de CSP. La app también es clickjackeable.
- **Fix recomendado:** agregar el bloque de headers a nivel `server {}` en `nginx.conf.template`.

### 3. `ProfilePage` simula guardar el perfil pero no persiste nada
- **Dónde:** `src/pages/ProfilePage.jsx:57-61`
- **Qué pasa:** `handleSaveProfile` tiene la llamada real comentada (`// await authService.updateProfile(formData)`) y solo actualiza el `AuthContext`/`localStorage` local, mostrando un toast de "guardado exitoso".
- **Impacto:** el usuario cree que actualizó su perfil y en realidad el cambio se pierde en el próximo login/refresh de token — falso positivo de UX con pérdida silenciosa de datos.
- **Fix recomendado:** descomentar/implementar la llamada real a `authService.updateProfile`, o si el endpoint no existe todavía en el BFF, deshabilitar el formulario con un aviso claro en vez de simular éxito.

### 4. Duplicación de clientes Axios ya causó un bug de sesión real
- **Dónde:** `src/services/paciService.js`, `src/services/jobsService.js` vs. `api.js`, `bffApi.js`, `adminPanelService.js`, `chatService.js`
- **Qué pasa:** hay 6 instancias de Axios hechas a mano, cada una reimplementando el interceptor de `Authorization: Bearer`. Cuatro de ellas también tienen un interceptor de respuesta que llama `handleAuthFailure` en 401 — **pero `paciService.js` y `jobsService.js` no lo tienen.**
- **Impacto:** un 401 (sesión expirada) en cualquier endpoint de PACI o de jobs falla silenciosamente en vez de redirigir a `/login`, dejando al usuario con una UI rota sin explicación.
- **Fix recomendado:** consolidar en un solo cliente Axios compartido (o al menos agregar el interceptor faltante a esos dos servicios) para que el manejo de sesión expirada sea uniforme.

---

## 🟡 Medio

### 5. Dependencias con CVEs "high" en `npm audit`
- **Dónde:** `package.json` / `package-lock.json`
- **Qué pasa:** `form-data` (vía `axios`), `nanoid`, `postcss` (path traversal en sourcemaps) y `react-router`/`react-router-dom@7.14.1` tienen advisories de severidad alta.
- **Contexto importante:** la app usa `<BrowserRouter>` plano (`src/App.jsx`), no `createBrowserRouter`/RSC/loaders — la mayoría de los CVEs de react-router (RCE por deserialización RSC, DoS por `__manifest`, CSRF en data routers) **no aplican** tal como está usado el código hoy.
- **Fix recomendado:** correr `npm audit fix` de todos modos; el upgrade es barato y cierra la superficie por si el código evoluciona hacia data routers más adelante.

### 6. Implementación de profesores duplicada y divergente en `bffApi.js` vs `adminPanelService.js`
- **Dónde:** `src/services/bffApi.js` (`getProfessors`, `createProfessor`, `updateProfessor`, `deleteProfessor` — sin uso) vs. `src/services/adminPanelService.js:207-247` (versión realmente usada por `AdminPanelPage.jsx`)
- **Qué pasa:** dos implementaciones paralelas del mismo CRUD contra el mismo endpoint (`ADMIN_ENDPOINTS.PROFESSORS`). Solo una está viva; la otra es deuda técnica que puede confundir a quien edite el código y termine tocando la versión muerta.
- **Fix recomendado:** eliminar los 4 métodos sin uso de `bffApi.js`.

### 7. `src/services/dashboardService.js` importado pero nunca llamado — dashboard sigue con datos mock en `develop`
- **Dónde:** `src/pages/DashboardPage.jsx:12` (import sin uso) y líneas 37-52 (`mockStats`/`mockStudents`/`mockMaterials` hardcodeados)
- **Qué pasa:** el commit que reemplaza los datos hardcodeados por datos reales del BFF (`70e71d7`, "feat(dashboard): reemplazar datos hardcodeados...") **vive solo en `feat/real-dashboard-data`, no está mergeado a `develop`.**
- **Impacto:** no es un bug de seguridad, pero es relevante para priorizar el merge — hoy el dashboard en `develop` muestra datos falsos a los usuarios.
- **Fix recomendado:** mergear `feat/real-dashboard-data` a `develop` cuando esté validado.

---

## 🟢 Bajo

### 8. `window.open` sin `noopener`/`noreferrer`
- **Dónde:** `src/services/chatService.js:104` (`downloadResult`)
- **Qué pasa:** abre una URL (probablemente un link presignado de S3) sin `rel="noopener noreferrer"`. Riesgo de reverse tabnabbing si esa URL alguna vez fuera influenciable por un atacante.
- **Nota:** el patrón correcto ya existe en el propio repo — `src/components/features/MarkdownView.jsx:24` sí lo hace bien.
- **Fix recomendado:** aplicar el mismo `rel` en `chatService.js:104`.

### 9. Validación de archivos solo en el cliente
- **Dónde:** `src/pages/NuevaSesionPage.jsx` (subida de PACI + material, atributo `accept`)
- **Qué pasa:** el filtro de tipo de archivo es solo HTML (`accept`), trivialmente evitable.
- **Fix recomendado:** no es explotable por sí solo — confirmar que `prisma-bff`/el workflow validan tipo y tamaño server-side (fuera del alcance de este repo).

### 10. `console.log` de debugging olvidados
- **Dónde:** `src/pages/AdminPanelPage.jsx:274,276`
- **Qué pasa:** loguean el payload/resultado completo de un anuncio en cada creación. Sin datos sensibles evidentes, pero es ruido de debug en producción.
- **Fix recomendado:** eliminar.

### 11. Stubs de UI duplicados con import inconsistente
- **Dónde:** `src/components/ui/{Button,Input,Modal,Badge}.jsx` vs. `src/components/ui/index.js`
- **Qué pasa:** cada archivo es un re-export de 1 línea desde `@luridlf/prisma-ui-lib`, duplicando lo que el barrel `ui/index.js` ya expone. Los modales de PACI (`Create/Edit/ViewPACIModal.jsx`) importan por la ruta larga (`../ui/Button`) en vez del barrel, a diferencia de todo el resto del repo.
- **Fix recomendado:** unificar el import a través del barrel y borrar los stubs individuales.

### 12. `colegioService.js` es un wrapper sin lógica agregada
- **Dónde:** `src/services/colegioService.js`
- **Qué pasa:** sus 7 métodos son `return await bffApi.xxx(...)` sin transformación ni manejo de errores propio.
- **Fix recomendado:** opcional — se puede dejar así por consistencia de nombres, o eliminar la capa y usar `bffApi` directo.

---

## ⚪ Informativo / limpieza menor

### 13. `src/services/index.js` — barrel completamente sin uso
Ningún archivo de `src/` importa desde este barrel; todos importan directo de cada servicio. Se puede borrar o completar (decisión de equipo).

### 14. `src/reportWebVitals.js` — no-op desde siempre
Se invoca sin argumento en `src/index.jsx:16`, así que el `if (onPerfEntry && ...)` nunca es verdadero. Es boilerplate de Create React App que nunca se conectó. Borrar o conectarlo a un endpoint real de analítica.

### 15. `src/constants/api.js:8` — `DOCS_API_URL` muerto
Confirmado: no se usa en ningún endpoint. Ya estaba documentado como dead code en `CLAUDE.md`.

### 16. `src/constants/api.js:60` — parámetro `id` sin usar (bug de copy-paste)
```js
ADMIN_ENDPOINTS.SESSION = (id) => `${BFF_BASE_URL}/api/admin/sessions`
```
Recibe `id` pero nunca lo interpola en el string, a diferencia de todas las entradas hermanas. Revisar si falta `/${id}` o si el parámetro sobra.

### 17. `README.md` desactualizado
Sigue siendo boilerplate de Create React App (menciona `npm start` en :3000, `eject`, etc.) y no refleza Vite/:3002. Ya conocido, sin acción urgente.

---

## Lo que se revisó y está limpio

- Sin secretos hardcodeados, sin `.env` versionado, sin `dangerouslySetInnerHTML`, sin `eval`.
- Regex de `stripMetadatos.js` segura (no vulnerable a ReDoS).
- Tokens de OAuth de Google llegan por el **fragmento** de la URL (`GoogleCallbackPage.jsx`), nunca se envían a ningún servidor.
- No hay problema de CSRF: la autenticación usa header `Authorization: Bearer`, no cookies.
- El RBAC del frontend (`AdminRoute`/`SuperAdminRoute`, filtrado en `SideNav`) es correctamente solo cosmético — no hay evidencia de que el frontend asuma que ocultar UI es el control de seguridad real. (No se pudo verificar el enforcement real del lado del BFF/backend — está fuera del alcance de este repo.)
- Las 12 páginas están enrutadas en `App.jsx`, sin páginas huérfanas.
- Cada archivo fuente tiene su test correspondiente; no se encontraron tests huérfanos.
- Las dependencias de `package.json` trazan a uso real en `src/`.

---

## Próximos pasos sugeridos (por esfuerzo/impacto)

1. **Esfuerzo mínimo, impacto alto:** agregar `access_log off;` en `/chat/` y el bloque de security headers en `nginx.conf.template` (#1, #2).
2. **Esfuerzo mínimo:** `npm audit fix` (#5), borrar `console.log` (#10), agregar `noopener` (#8).
3. **Esfuerzo bajo, evita bugs silenciosos:** agregar el interceptor de 401 faltante en `paciService.js`/`jobsService.js` (#4).
4. **Requiere decisión de producto:** arreglar o deshabilitar el guardado de perfil (#3), mergear `feat/real-dashboard-data` (#7).
5. **Limpieza cuando haya tiempo:** ítems #6, #9, #11-#17.
