# Diseño — Modal de revisión HITL con contenido formateado

**Fecha:** 2026-06-09
**Repos afectados:** `prisma-front` (principal), `prisma_workflow` (cambio mínimo)
**Estado:** Aprobado

---

## 1. Problema

En el checkpoint HITL del flujo multi-agente, el profesor revisa dos documentos generados por
los agentes (Análisis PACI y Planificación Adaptada) y decide aprobar o rechazar. Hoy esos
documentos se muestran en una `HitlCard` inline dentro del chat (`SesionPage.jsx`), renderizados
con `whitespace-pre-wrap` — es decir, **texto crudo**. Como los agentes emiten **Markdown**
(`## encabezados`, `**negritas**`, listas `-`, checkboxes `[ ]`, `### JUSTIFICACIÓN PEDAGÓGICA`),
el profesor ve los símbolos literales (`##`, `**`) sin formato: el "texto vomitado".

Además, el contenedor inline limita el alto de lectura y mezcla la decisión con el scroll del chat.

## 2. Objetivo

Presentar los hallazgos del agente en un **modal dedicado y cómodo**, con el Markdown renderizado,
y un flujo de respuesta claro. El profesor debe poder leer documentos largos con tipografía legible
y responder (aprobar / rechazar con motivo) sin fricción.

## 3. Decisiones tomadas (con su justificación)

| Decisión | Elección | Por qué |
|----------|----------|---------|
| Formato del contenido | **Renderizar el Markdown actual** (react-markdown + remark-gfm) | Los agentes ya emiten Markdown; cero cambios de formato en backend; sin riesgo XSS; no afecta la generación del `.docx` que consume el mismo texto. Se descartó "agente devuelve HTML" (frágil, inseguro, rompe el `.docx`) y "salida JSON estructurada" (reescribe prompts, más tokens, riesgo en contenido normativo). |
| Contenedor UX | **Modal dedicado y amplio** | Más espacio de lectura para documentos largos; separa la decisión del scroll del chat. |
| Componente base del modal | **Componente nuevo `HitlReviewModal`** (no el `Modal` de `@luridlf/prisma-ui-lib`) | El Modal de la lib solo llega a `max-w-2xl`, está centrado con `p-6`, y **no maneja scroll interno (header/footer fijos) ni dark mode** (`bg-white`). El resto de `SesionPage` sí usa dark mode. |
| Flujo de rechazo | **Solo motivo** (se elimina la elección de agente) | UX más simple para el profesor. |
| Routing en rechazo | **Siempre Agente 2 (Adaptador)** | El checkpoint revisa el material adaptado; determinista y sin costo extra de tokens. Se descartó el clasificador LLM (1 llamada extra) y "reintentar ambos" (duplica tokens). |
| Cierre del modal | **Bloqueante** | No se puede cerrar sin decidir (sin botón X, click-fuera y Escape no cierran). El checkpoint pausa el workflow; evita que el profesor lo olvide. |

## 4. Arquitectura de la solución

### 4.1 Frontend (`prisma-front`)

**Dependencias nuevas**
- `react-markdown` y `remark-gfm`. Renderizan Markdown de forma segura (sin
  `dangerouslySetInnerHTML`). `remark-gfm` habilita tablas, listas de tareas (`[ ]`) y autolinks.

**Componente `MarkdownView` — `src/components/features/MarkdownView.jsx`**
- Propósito: renderizar un string Markdown con tipografía legible en claro/oscuro.
- Entrada: `{ children: string }` (el Markdown).
- Comportamiento:
  - Aplica `stripMetadatos()` al texto antes de renderizar.
  - Envuelve `<ReactMarkdown remarkPlugins={[remarkGfm]}>` con un mapa de componentes/clases Tailwind
    para `h1..h3`, `ul/ol/li`, `strong`, `table`, `code`, `p`, etc., con variantes `dark:`.
- Dependencias: `react-markdown`, `remark-gfm`, util `stripMetadatos`.

**Util `stripMetadatos` — `src/utils/stripMetadatos.js`**
- Propósito: eliminar el bloque de metadatos de máquina antes de mostrar el texto al profesor.
- Firma: `stripMetadatos(text: string): string`.
- Comportamiento: elimina todo entre `---METADATOS---` y `---FIN_METADATOS---` (inclusive),
  tolerante a espacios. Si no hay bloque, devuelve el texto intacto. Hace `trim` del resultado.

**Componente `HitlReviewModal` — `src/components/features/HitlReviewModal.jsx`**
- Propósito: modal bloqueante de revisión y decisión del checkpoint HITL.
- Entrada: `{ hitlData: {perfil_paci, planificacion_adaptada, attempt, max_attempts}, onRespond }`.
- Salida: invoca `onRespond({ approved, reason })`.
- Estructura visual:
  - **Overlay** `fixed inset-0 z-50 bg-black/50` — NO cierra con click-fuera.
  - **Contenedor** ancho cómodo (`max-w-3xl` por defecto), alto acotado (`max-h-[90vh]`),
    layout en columna: header fijo / cuerpo con scroll / footer fijo. Soporta dark mode.
  - **Header fijo**: "Revisión requerida — intento {attempt} de {max_attempts}". Sin botón de cerrar.
  - **Pestañas**: `Análisis PACI (Agente 1)` → `perfil_paci`; `Planificación Adaptada (Agente 2)`
    → `planificacion_adaptada`. Cada panel usa `<MarkdownView>`.
  - **Cuerpo**: `overflow-y-auto`, solo el contenido de la pestaña activa hace scroll.
  - **Footer fijo**:
    - Estado inicial: botones `[Aprobar]` y `[Rechazar]`.
    - Tras `Rechazar`: textarea "¿Qué debería corregirse?" (requerido) + `[Confirmar rechazo]`
      (deshabilitado si el motivo está vacío) + `[Volver]` (regresa al estado inicial).
- Accesibilidad: bloquea el `Escape`; foco atrapado dentro del modal; `aria-modal`.
- Dependencias: `MarkdownView`.

**`SesionPage.jsx`**
- Elimina los componentes internos `HitlCard` y `HitlAccordion` (quedan obsoletos).
- Renderiza `<HitlReviewModal hitlData={hitlData} onRespond={handleHitlRespond} />`
  cuando `phase === 'awaiting_hitl' && hitlData`.
- `handleHitlRespond(response)`: envía solo `{ approved, reason }` (sin `agent_to_retry`),
  luego `setHitlData(null)` y `setPhase('running')` (igual que hoy).

**`chatService.sendHitlDecision`**
- Deja de pasar `agentToRetry`. El cuerpo enviado es `{ approved, reason }` (omite `agent_to_retry`).

**Fuera de alcance (anotado, no se implementa ahora)**
- Renderizar también los `MessageBubble` del agente con `MarkdownView`. Se mantiene el foco en HITL.

### 4.2 Backend (`prisma_workflow`)

**`prisma_agents/api/workflow_runner.py` (~línea 115)**
- Cambio de una línea:
  ```python
  # Antes: si el front no envía agente, 0 → agent.py cancela el flujo.
  agent_to_retry = int(response.get("agent_to_retry") or 0)
  # Después: ausencia de agente → 2 → re-adapta con Agente 2.
  agent_to_retry = int(response.get("agent_to_retry") or 2)
  ```
- El caso "intentos agotados" (línea ~119: `if not approved and attempt >= max_attempts`) ya
  retorna sentinel `0` explícitamente y cancela — **no se ve afectado**.
- El path CLI usa `_hitl_checkpoint` (consola), una función distinta — **no se toca**.

**`prisma_agents/api/schemas.py`**
- `HitlResponseBody.agent_to_retry` permanece `Optional[int]` (compatibilidad hacia atrás). No se
  elimina; el front simplemente deja de enviarlo.

## 5. Flujo de datos (sin cambios estructurales)

```
SSE hitl_required
  → hitlData { perfil_paci, planificacion_adaptada, attempt, max_attempts }
  → HitlReviewModal: stripMetadatos + render Markdown por pestaña
  → profesor decide
      ├─ Aprobar  → POST /hitl { approved: true }            → workflow continúa
      └─ Rechazar → POST /hitl { approved: false, reason }   → workflow re-adapta (Agente 2)
```

## 6. Qué NO cambia
- El contrato SSE y los campos de `hitlData`.
- La generación del `.docx` (consume el mismo Markdown de `planificacion_adaptada`).
- El path CLI del workflow.
- Los límites de intentos HITL (3) y el comportamiento de "intentos agotados".

## 7. Estrategia de testing

**Frontend (Vitest)**
- `stripMetadatos`: elimina el bloque `---METADATOS---…---FIN_METADATOS---`; deja intacto un texto
  sin bloque; hace trim.
- `MarkdownView`: renderiza encabezados, listas y negritas (no muestra `##`/`**` literales);
  no renderiza el bloque de metadatos.
- `HitlReviewModal`:
  - Es bloqueante: `Escape` y click en el overlay no invocan cierre ni `onRespond`.
  - `Aprobar` → `onRespond({ approved: true })`.
  - `Rechazar` muestra el textarea; `Confirmar rechazo` está deshabilitado con motivo vacío;
    con motivo → `onRespond({ approved: false, reason })`.
  - `Volver` regresa al estado inicial de botones.

**Backend (pytest)**
- Rechazo no-final con `agent_to_retry` ausente → el callback retorna `agent_to_retry == 2`
  (enruta al Agente 2).
- Caso intentos agotados → sigue retornando sentinel `0` y cancela.

## 8. Riesgos y mitigaciones
- **Markdown malformado del LLM**: react-markdown degrada con gracia (muestra texto). Sin riesgo de ruptura.
- **Bloque METADATOS con formato inesperado**: `stripMetadatos` es tolerante a espacios y, si no
  encuentra el bloque, no altera el texto.
- **Regresión del path CLI**: el cambio está acotado a `workflow_runner.py` (solo API); el CLI usa
  otra ruta. Cubierto por test de backend.
