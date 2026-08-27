# Prompt de corrección — prisma-front

> Este documento es un **prompt de ejecución** pensado para pegarse directo en una sesión de Claude
> Code (u otro agente) sobre el repo `prisma-front`, rama `develop`. Cada tarea incluye qué está mal,
> **cómo debería quedar exactamente**, los pasos de implementación y el criterio de aceptación. Están
> ordenadas de más crítico a menos crítico — hacé las tareas en orden salvo que se indique lo contrario.
>
> Reglas generales para todas las tareas:
> - No introducir dependencias nuevas salvo que se indique explícitamente.
> - Seguir los patrones ya existentes en el repo (interceptores de Axios, estilo de los servicios,
>   convenciones de import) en vez de inventar uno nuevo — se señala el patrón de referencia en cada
>   tarea cuando aplica.
> - Cada tarea es independiente y commiteable por separado. No mezclar tareas en un mismo commit.
> - Actualizar o agregar tests cuando la tarea toca lógica con cobertura existente.

---

## Tarea 1 — Dejar de loguear el JWT en las conexiones SSE (nginx)

**Estado actual:** `SesionPage.jsx:167` y `ActiveSessionContext.jsx:48` abren el `EventSource` con
`GET /chat/:id/stream?token=<jwt>`. El `location /chat/` en `nginx.conf.template` no desactiva el
`access_log`, así que cada conexión y reconexión deja el JWT completo en texto plano en los logs de
nginx (y de ahí, en cualquier sistema de agregación de logs — CloudWatch, ELK, etc.).

**Cómo debería quedar:** el `location /chat/` (y también `/health/` y `/feedback/`, por consistencia,
aunque esos no llevan token) no debe escribir la query string en el log de acceso. La forma correcta es
desactivar el log de acceso para esa location específica, **no** tocar el log global del `server {}`
(otras locations sí necesitan logging normal para debugging/monitoreo).

**Pasos de implementación:**
1. Abrir `nginx.conf.template`.
2. En el bloque `location /chat/` (el que ya tiene `proxy_buffering off`, `proxy_cache off`,
   `proxy_read_timeout 1h`), agregar la directiva `access_log off;`.
3. Si el equipo prefiere mantener visibilidad de que hubo conexiones (sin el token), como alternativa
   se puede definir un `log_format` nuevo que excluya `$request`/`$request_uri` y usarlo solo en esa
   location — pero la opción por defecto y más simple es `access_log off;`. Usar esa salvo que el
   usuario pida lo segundo explícitamente.
4. Verificar que el resto de las directivas del bloque (`proxy_set_header`, etc.) no se toquen.

**Criterio de aceptación:** el archivo `nginx.conf.template` tiene `access_log off;` dentro de
`location /chat/`. No se modifica el logging de `location /api/` ni del `server {}` general.

---

## Tarea 2 — Agregar security headers a la respuesta de la SPA (nginx)

**Estado actual:** `nginx.conf.template` no envía ningún header de hardening en las respuestas del
front (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
`Strict-Transport-Security`). El JWT vive en `localStorage`, así que ante un XSS futuro no hay ninguna
barrera adicional, y la app es embebible en un iframe de cualquier origen (clickjacking).

**Cómo debería quedar:** el bloque `server {}` de `nginx.conf.template` debe agregar, a nivel servidor
(para que aplique a todas las responses, incluida la SPA estática):

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'" always;
```

**Pasos de implementación:**
1. Revisar primero qué orígenes externos consume realmente la app en runtime (Google OAuth redirige a
   `accounts.google.com`, así que si el flujo de login hace un `window.location` completo a Google
   —no un `fetch`/XHR desde el frontend— no hace falta agregar ese dominio a `connect-src`; confirmar
   revisando `LoginPage.jsx`/`GoogleCallbackPage.jsx` cómo se dispara el login antes de cerrar el CSP).
2. Agregar los headers de arriba al bloque `server {}` en `nginx.conf.template`, ajustando `connect-src`
   e `img-src` si hace falta un dominio adicional confirmado en el paso 1 (por ejemplo, si el avatar de
   Google se carga como `<img src="https://lh3.googleusercontent.com/...">`, agregar ese host a
   `img-src`).
3. **No** agregar `unsafe-inline` a `script-src` — Vite en build de producción no debería requerirlo. Si
   el build falla por CSP en dev, es porque el header solo debe aplicar en producción vía nginx, no en
   el dev server de Vite (`vite.config.js` no se toca en esta tarea).
4. Probar el build (`npm run build && npm run preview`) y verificar en devtools que no haya
   violaciones de CSP en consola durante un flujo completo: login, dashboard, HITL chat.

**Criterio de aceptación:** los 5 headers están presentes en la respuesta HTTP de la SPA servida por
nginx, y un recorrido manual completo de la app (login → dashboard → sesión de chat → logout) no genera
ninguna violación de CSP en la consola del navegador.

---

## Tarea 3 — Persistir de verdad la edición de perfil

**Estado actual:** `src/pages/ProfilePage.jsx:57-61`, función `handleSaveProfile`:

```js
// await authService.updateProfile(formData);
updateUser(formData); // solo actualiza AuthContext/localStorage
```

La llamada real al backend está comentada. El usuario ve un toast de "perfil actualizado" pero el
cambio se pierde en el próximo login o refresh de token, porque nunca se mandó al BFF.

**Cómo debería quedar:** dos escenarios posibles, elegir según lo que exista en `prisma-bff`:

- **Si `POST/PUT /api/auth/profile` (o equivalente) ya existe en el BFF:** descomentar y usar la
  llamada real, con manejo de error correcto (si falla, no actualizar `AuthContext` ni mostrar el toast
  de éxito — mostrar un toast de error en su lugar). El flujo correcto es: `await
  authService.updateProfile(formData)` → si resuelve OK, recién ahí `updateUser(formData)` +
  toast de éxito; si rechaza, toast de error y no tocar el estado local.
- **Si el endpoint todavía no existe en el BFF:** no simular un guardado exitoso. Deshabilitar el botón
  de guardar (o el formulario completo) con un mensaje visible tipo "Edición de perfil próximamente" en
  vez de aceptar el submit y mentir sobre el resultado.

**Pasos de implementación:**
1. Revisar `src/services/authService.js` para confirmar si `updateProfile` ya existe como método y qué
   endpoint pega (buscar `PROFILE` o `profile` en `constants/api.js`).
2. Si el endpoint existe en `constants/api.js` pero el método de `authService.js` está incompleto o
   comentado, completarlo siguiendo el patrón de los demás métodos del mismo archivo (mismo manejo de
   errores, mismo uso de la instancia de Axios ya configurada).
3. En `ProfilePage.jsx`, reescribir `handleSaveProfile` como una función `async` que:
   - Ponga un estado de loading en el botón de guardar mientras la request está en vuelo.
   - Llame a `authService.updateProfile(formData)`.
   - En éxito: actualice `AuthContext` vía `updateUser(...)` con la respuesta del backend (no con el
     `formData` local, para reflejar cualquier normalización que haga el servidor) y muestre el toast de
     éxito existente.
   - En error: muestre un toast de error (reusar el mecanismo de toasts ya usado en el resto del archivo
     o de la app) y **no** llame a `updateUser`.
4. Si se determina que el endpoint no existe todavía: en vez de lo anterior, deshabilitar el submit y
   agregar el mensaje de "próximamente", dejando un comentario corto indicando qué endpoint del BFF hay
   que esperar (sin comentarios largos, una sola línea).
5. Actualizar `ProfilePage.test.jsx` para cubrir: guardado exitoso actualiza el contexto y muestra toast
   de éxito; guardado fallido muestra toast de error y no actualiza el contexto.

**Criterio de aceptación:** ya no existe código comentado en `handleSaveProfile`; el comportamiento
visible al usuario coincide con si el dato realmente persistió o no; los tests nuevos pasan.

---

## Tarea 4 — Unificar el manejo de sesión expirada (401) en todos los servicios

**Estado actual:** `api.js`, `bffApi.js`, `adminPanelService.js` y `chatService.js` tienen un
interceptor de respuesta que, ante un 401, llama a `handleAuthFailure` (de `services/authSession.js`)
para redirigir a `/login`. `paciService.js` y `jobsService.js` **no tienen ese interceptor** — un 401 en
esos endpoints falla silenciosamente (la promesa se rechaza, el componente que llamó probablemente
solo muestra un error genérico o no muestra nada) en vez de sacar al usuario a login.

**Cómo debería quedar:** los seis servicios deben comportarse igual ante un 401: redirigir a login vía
`handleAuthFailure`, con el mismo lock anti-doble-redirect que ya implementa `authSession.js`.

**Pasos de implementación (elegir opción A, es la preferida — más simple y menos riesgo que una
refactorización mayor):**

**Opción A — parche mínimo (recomendada para esta tarea):**
1. Abrir `src/services/paciService.js` y `src/services/jobsService.js`.
2. Copiar el interceptor de respuesta exacto que usa `src/services/bffApi.js` (buscar el bloque
   `.interceptors.response.use(...)` que llama `handleAuthFailure` en `error.response?.status === 401`).
3. Pegarlo en ambos archivos, sobre la misma instancia de Axios que ya crean con `axios.create(...)`,
   importando `handleAuthFailure` desde `./authSession` igual que hacen los otros servicios.
4. No cambiar nada más del comportamiento de estos dos archivos.

**Opción B — consolidación completa (solo si el usuario pide explícitamente reducir la duplicación,
no hacer por iniciativa propia en esta tarea):** crear un único módulo `src/services/httpClient.js`
que exporte una factory `createApiClient(baseURL)` con el interceptor de request (Bearer token) y el de
response (401 → `handleAuthFailure`) ya armados, y hacer que los 6 servicios llamen a esa factory en vez
de `axios.create()` directo. Esto es un cambio más grande que toca los 6 archivos — evaluar el impacto
en los tests existentes de cada servicio antes de encararlo.

**Criterio de aceptación:** un 401 devuelto por cualquier endpoint de PACI o de jobs dispara el mismo
flujo de logout/redirect que ya disparan los demás servicios. Agregar (o extender) un test en
`paciService.test.js` y `jobsService.test.js` que simule una respuesta 401 y verifique que se llama a
`handleAuthFailure` (mockeado).

---

## Tarea 5 — Actualizar dependencias con CVEs

**Estado actual:** `npm audit` reporta 6 vulnerabilidades "high": `form-data` (vía `axios`), `nanoid`,
`postcss`, y `react-router`/`react-router-dom@7.14.1`.

**Cómo debería quedar:** dependencias actualizadas a versiones sin advisories conocidos, sin romper el
build ni los tests.

**Pasos de implementación:**
1. Correr `npm audit fix` (sin `--force` primero) y ver cuánto resuelve solo.
2. Si `react-router-dom` no sube de versión mayor con el fix automático, revisar el changelog de la
   versión parchada antes de forzar un bump mayor — la app usa `<BrowserRouter>` plano (no
   `createBrowserRouter`), así que un upgrade dentro de la v7 no debería requerir cambios de código.
3. Después de actualizar, correr `npm run build` y `npm test` completos. Si algo rompe, es más
   importante entender por qué que forzar el update — reportar el conflicto en vez de usar
   `--force` a ciegas.
4. Commitear `package.json` y `package-lock.json` juntos.

**Criterio de aceptación:** `npm audit --production` no reporta vulnerabilidades "high" ni "critical".
`npm run build` y `npm test` pasan igual que antes del update.

---

## Tarea 6 — Eliminar el CRUD de profesores duplicado en `bffApi.js`

**Estado actual:** `bffApi.js` exporta `getProfessors`, `createProfessor`, `updateProfessor`,
`deleteProfessor` — ninguno tiene un solo caller en todo `src/`. `AdminPanelPage.jsx` usa en cambio la
implementación de `adminPanelService.js:207-247`, que pega al mismo endpoint
(`ADMIN_ENDPOINTS.PROFESSORS`) de forma independiente.

**Cómo debería quedar:** una sola implementación del CRUD de profesores, la que ya está en uso
(`adminPanelService.js`). `bffApi.js` no debe tener código de profesores sin consumidores.

**Pasos de implementación:**
1. Confirmar con un grep (`grep -rn "bffApi\.\(get\|create\|update\|delete\)Professor" src/`) que
   efectivamente no hay ningún caller antes de borrar — si apareciera alguno, esta tarea cambia de
   alcance y hay que avisar en vez de borrar a ciegas.
2. Borrar los 4 métodos de `bffApi.js` (y cualquier import/tipo que quede huérfano por esa eliminación).
3. Revisar `bffApi.test.js` por si tiene tests de esos métodos — si los tiene, borrarlos también (no
   dejar tests de código que ya no existe).
4. No tocar `adminPanelService.js` — esa es la implementación que se mantiene tal cual está.

**Criterio de aceptación:** `bffApi.js` ya no exporta funciones de profesores; `AdminPanelPage.jsx`
sigue funcionando exactamente igual (usa `adminPanelService.js`, no tocado); `npm test` sigue en verde.

---

## Tarea 7 — Decidir el destino de `dashboardService.js` y el dashboard con datos mock

**Estado actual:** en `develop`, `DashboardPage.jsx` importa `dashboardService` (línea 12) pero nunca lo
llama — sigue renderizando `mockStats`/`mockStudents`/`mockMaterials` hardcodeados (líneas 37-52). El
trabajo real de conectar el dashboard a datos del BFF existe en el commit `70e71d7`
("feat(dashboard): reemplazar datos hardcodeados por datos reales del BFF"), que vive en la rama
`feat/real-dashboard-data` y **no está mergeado a `develop`**.

**Cómo debería quedar:** esto no es un fix aislado de código — es una decisión de flujo de trabajo.
No implementar una versión nueva desde cero; el trabajo ya existe.

**Pasos de implementación:**
1. Antes de tocar código, preguntar/confirmar con el usuario si `feat/real-dashboard-data` está listo
   para mergear a `develop`, o si hay que traer solo el commit `70e71d7` vía cherry-pick.
2. Si se confirma el merge: hacer el merge (o cherry-pick) de `feat/real-dashboard-data` a `develop`,
   resolviendo conflictos si los hay, y correr la suite de tests completa después.
3. Si el dashboard con datos reales todavía no está listo para producción: dejar constancia explícita
   (comentario corto en `DashboardPage.jsx` junto al import sin uso, o un TODO con el número de rama) de
   que el import de `dashboardService` es intencional-pendiente y no un olvido, para que no se borre por
   error en una futura limpieza de código muerto.

**Criterio de aceptación:** o bien `DashboardPage.jsx` usa `dashboardService` y muestra datos reales, o
bien queda documentado por qué sigue en mock — no debe quedar ambiguo.

---

## Tarea 8 — Limpieza rápida (agrupar en un solo commit de housekeeping)

Cada ítem es chico e independiente entre sí, pero de bajo riesgo — se pueden hacer todos juntos en un
commit de limpieza si el usuario lo prefiere así, o separados si prefiere revisar uno por uno.

### 8.1 — `noopener`/`noreferrer` faltante
**Dónde:** `src/services/chatService.js:104`, función `downloadResult`.
**Cómo debería quedar:** igual que ya lo resuelve `src/components/features/MarkdownView.jsx:24` — al
abrir la URL con `window.open`, pasar el tercer argumento `'noopener,noreferrer'`:
```js
window.open(url, '_blank', 'noopener,noreferrer');
```

### 8.2 — `console.log` de debug en producción
**Dónde:** `src/pages/AdminPanelPage.jsx:274` y `:276`.
**Cómo debería quedar:** eliminados. Si el equipo necesita logging real para debugging en producción, no
es con `console.log` de payloads completos — abrir esa conversación aparte, no resolverla en esta tarea.

### 8.3 — `reportWebVitals.js` no-op
**Dónde:** `src/index.jsx:16`, `src/reportWebVitals.js`.
**Cómo debería quedar:** dos caminos válidos, elegir uno:
- **Borrar:** eliminar `src/reportWebVitals.js` y la línea que lo invoca en `index.jsx`, si no hay plan
  de mandar estas métricas a ningún lado.
- **Conectar:** pasarle una función real a `reportWebVitals(onPerfEntry)` que mande las métricas a donde
  el equipo quiera (analítica propia, etc.) — solo hacer esto si el usuario confirma que quiere Web
  Vitals activos; si no lo confirma, preferir borrar.

### 8.4 — `src/services/index.js` sin uso
**Cómo debería quedar:** dos caminos, elegir uno:
- **Borrar el archivo** si el equipo no piensa usar el patrón de barrel para servicios.
- **Completarlo** agregando los re-exports que faltan (`paciService`, `jobsService`,
  `adminPanelService`, `colegioService`, `bffApi`) y migrar los imports directos a usar el barrel — esto
  es un cambio más grande que toca muchos archivos, no encararlo salvo pedido explícito.
Por defecto, preferir **borrar** salvo que el usuario diga lo contrario — es la opción de menor riesgo.

### 8.5 — `DOCS_API_URL` muerto
**Dónde:** `src/constants/api.js:8`.
**Cómo debería quedar:** eliminado, junto con la env var `VITE_DOCS_API_URL` en `.env.example` si no se
usa en ningún otro lado del proyecto (confirmar con grep en todo el repo, no solo `src/`).

### 8.6 — Bug de copy-paste en `ADMIN_ENDPOINTS.SESSION`
**Dónde:** `src/constants/api.js:60`:
```js
SESSION: (id) => `${BFF_BASE_URL}/api/admin/sessions`,
```
**Cómo debería quedar:** revisar contra el backend real qué endpoint corresponde. Si el endpoint
correcto necesita el `id` (por ejemplo `GET /api/admin/sessions/:id`), corregir a:
```js
SESSION: (id) => `${BFF_BASE_URL}/api/admin/sessions/${id}`,
```
Si en cambio el endpoint real es una lista sin `id` (`GET /api/admin/sessions`), dejar el string como
está pero **quitar el parámetro `id`** de la firma para que no sea engañoso, y revisar/actualizar los
callers que hoy le pasan un `id` que se ignora.

### 8.7 — Imports inconsistentes de componentes UI
**Dónde:** `src/components/features/CreatePACIModal.jsx`, `EditPACIModal.jsx`, `ViewPACIModal.jsx`
(importan `Button`/`Input`/`Modal`/`Badge` desde `../ui/Button`, etc. en vez del barrel).
**Cómo debería quedar:** todos los componentes importan desde el barrel `../ui` (o la ruta que use el
resto del repo, por ejemplo `import { Button, Input, Modal, Badge } from '../ui'`), igual que hacen las
demás páginas/componentes. Después de migrar los 3 modales, si `src/components/ui/{Button,Input,Modal,
Badge}.jsx` quedan sin ningún importador directo, borrarlos (el barrel sigue reexportando desde
`@luridlf/prisma-ui-lib` directamente).

### 8.8 — `colegioService.js` como wrapper sin lógica
**Cómo debería quedar:** esta es la de menor prioridad de todo el documento y la única donde la
recomendación es **no tocar nada** salvo pedido explícito — el wrapper es inofensivo y le da un nombre
de dominio claro (`colegioService` en vez de llamar a `bffApi` directo desde las páginas de colegios).
Mencionada acá solo para que quede registrada la duplicación, no como acción pendiente.

**Criterio de aceptación de la Tarea 8:** cada sub-ítem resuelto no cambia comportamiento visible de la
app; `npm test` y `npm run build` siguen en verde después de cada uno.

---

## Orden sugerido de ejecución

1. Tarea 1 y 2 (nginx) — no tocan código de React, bajo riesgo, alto impacto de seguridad.
2. Tarea 5 (`npm audit fix`) — aislada, rápida de verificar.
3. Tarea 4 (401 en paciService/jobsService) — bug funcional real, riesgo bajo.
4. Tarea 3 (perfil) — requiere confirmar si el endpoint de BFF existe antes de programar.
5. Tarea 6 y 8 — limpieza, hacer al final y de a poco.
6. Tarea 7 — es una decisión de branch/merge, no de código; resolver cuando el usuario lo indique
   explícitamente.
