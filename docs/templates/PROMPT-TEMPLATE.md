PROMPT-TEMPLATE — Formato canónico para prompts a Claude Code  
\================================================================

Versión: 1.0  
Fecha: 13 de mayo de 2026  
Status: Accepted  
Aplicación: TODOS los prompts de sprint (A1-A6, B1-B6, C, D, E y futuros)  
Path esperado en repo: docs/PROMPT-TEMPLATE.md  
Referencia base: SPRINT-FASE-6.1-PROMPT (Drive 1rtpcJG3rpByZhJ4fIm1LY3C12zneDJJ0skWYHUNVstE)

PROPÓSITO  
\=========

Este documento define el formato fijo de todos los prompts ejecutables que se le pasan a Claude Code para ejecutar un sprint.

Garantiza que:  
\- Code siempre recibe la misma estructura, sin sorpresas.  
\- Yair, una IA, una empresa de programación o un colaborador externo pueden pegar un prompt y ejecutar sin pensar.  
\- Las 5 capas de la plataforma (BD, Código, UI/UX, Estilos, Galería) quedan explícitamente declaradas en cada sprint.  
\- Pre-mortem y verificación inicial son obligatorios antes de codear.  
\- El cierre de sprint actualiza siempre los mismos docs (vivos), sin desincronización repo ↔ Drive.

Cualquier prompt que no siga este formato es un prompt fuera de protocolo y debe rehacerse antes de pegarse a Code.

CUÁNDO USAR ESTE TEMPLATE  
\==========================

Usar SIEMPRE que:  
\- Se le pide a Code construir un sprint del plan A → B → C → D → E  
\- Se le pide a Code hacer un fix mayor (3+ archivos tocados)  
\- Se le pide a Code una migration con BEGIN/COMMIT

NO usar para:  
\- Tareas ad-hoc menores (1 fix de typo, 1 línea de código)  
\- Comandos puntuales de verificación vía MCP  
\- Consultas SQL exploratorias

Para tareas menores, prompt libre directo es válido.

CONVENCIONES VISUALES  
\======================

1\. SEPARADORES DE BLOQUE  
   Usar siempre la línea triple igual gruesa:  
     
   ═══════════════════════════════════════════════════════════════════  
     
   Esto divide el prompt en bloques ejecutables autónomos que Code puede procesar parte por parte.

2\. NUMERACIÓN DE PARTES  
   Las PARTES van con número correlativo (PARTE 0, PARTE 1, PARTE 2...). Subsecciones con notación punto (5.1, 5.2, 5.A, 5.B).

3\. VERBATIM  
   Cualquier ID, slug, path, SQL, comando se incluye verbatim. Cero ambigüedad. Code no debe inventar nombres.

4\. REFERENCIAS CRUZADAS  
   Cuando una decisión técnica viene de un RFC o ADR, citar explícitamente:  
   \- "D62 (RFC-003)" — decisión 62 del RFC-003  
   \- "ADR-036" — Architectural Decision Record 036  
   \- "AP-001 a AP-006" — atajos de protocolo del RUNBOOK

5\. DATOS PRODUCTIVOS VISIBLES  
   Siempre que el sprint toque datos reales, declarar las métricas: "2,395 personas, 280 eventos, 1,381 envíos productivos". Code sabe qué está tocando.

6\. CHECKBOXES EN DECLARACIÓN DE CAPA  
   Estilo \[x\] para lo que aplica, \[ \] para lo que no:  
   \[x\] Módulo NUEVO: salud  
   \[x\] EXTIENDE módulo comunicaciones  
   \[ \] Crea tablas (NO, personas\_lesiones ya existe)

ESTRUCTURA FIJA DEL PROMPT  
\===========================

Todo prompt sigue esta estructura, sin excepción.

BLOQUE A — CONTEXTO OBLIGATORIO  
\================================

═══════════════════════════════════════════════════════════════════  
CONTEXTO OBLIGATORIO — LEER ANTES DE EMPEZAR  
═══════════════════════════════════════════════════════════════════

Lista numerada de docs que Code DEBE leer antes de tocar código:

1\. /CLAUDE.md  
2\. /docs/CURRENT-STATE.md (estado al cierre del sprint anterior)  
3\. /docs/SPRINT-PLAN.md  
4\. /docs/rfcs/RFC-XXX-nombre.md (RFC que canoniza las decisiones de este sprint)  
5\. /docs/RUNBOOK.md (AP-001 a AP-006 vigentes)  
6\. /docs/PROMPT-TEMPLATE.md (este documento)  
7\. /docs/DECISIONS.md (ADRs relevantes con números explícitos)  
8\. modules/X/ (módulos de referencia que se reutilizan o extienden)  
9\. modules/Y/ (módulos con los que se integra)

Si alguno de los docs no existe en el repo, parar y avisar antes de codear.

BLOQUE B — DECLARACIÓN DE CAPA  
\===============================

═══════════════════════════════════════════════════════════════════  
DECLARACIÓN DE CAPA — RESPONDÉ ANTES DE EMPEZAR  
═══════════════════════════════════════════════════════════════════

Confirmá explícitamente con checkboxes:

CAPAS que toca este sprint:  
\[x\] CAPA BD: migrations, tablas, funciones, triggers, RLS  
\[x\] CAPA CÓDIGO: módulos, lib/, server actions, queries, tipos  
\[x\] CAPA UI/UX: pantallas, componentes, layouts, navegación  
\[x\] CAPA ESTILOS: design tokens, colores, tipografía, spacing  
\[x\] CAPA GALERÍA: mockup ASCII o link Figma, screenshots de pantallas nuevas

CAPAS que NO toca este sprint:  
\[ \] (lo que no aplica)

CONTEXTO (2-4 párrafos):  
\- Qué se construye en este sprint en términos operativos.  
\- Por qué importa (qué problema resuelve para el usuario).  
\- Métricas de datos productivos que se tocan (si aplica).

DECISIONES TÉCNICAS REFERENCIADAS:  
\- D62 (RFC-003): \[texto corto de la decisión\]  
\- D64 (RFC-003): \[texto corto\]  
\- ADR-036: dot-notation en permission slugs  
\- (etc.)

BLOQUE C — HEADER DE SPRINT  
\============================

═══════════════════════════════════════════════════════════════════  
SPRINT \[ID\] — \[Nombre del sprint\]  
═══════════════════════════════════════════════════════════════════

OBJETIVO  
\[Lista de 3-5 capacidades concretas que el usuario tiene al final del sprint. Cada una debe ser una frase corta empezando con un verbo de acción.\]

ALCANCE

SÍ entra:  
\[Lista numerada de bloques de trabajo concretos.\]  
\[Cada bloque puede incluir: SQL exacto, paths de archivos, slugs verbatim, nombres de migrations.\]

NO entra:  
\[Lista clara de lo que se POSTERGA, con referencia a la fase futura donde se hará.\]  
\[Esto bloquea scope creep.\]

DEPENDENCIAS  
\- Sprints previos que deben estar cerrados (con tag verbatim)  
\- RFCs commiteados al repo (paths)  
\- Módulos operativos (lista)  
\- Decisiones canonizadas en ADRs

BLOQUE D — PARTE 0: PRE-MORTEM  
\===============================

═══════════════════════════════════════════════════════════════════  
PARTE 0 — PRE-MORTEM (R-PE9 OBLIGATORIO)  
═══════════════════════════════════════════════════════════════════

Antes de codear, Code declara los riesgos identificados con la siguiente tabla:

| \# | Riesgo | Probabilidad | Impacto | Mitigación |  
| \- | \------ | \------------ | \------- | \---------- |  
| S1 | \[Descripción del riesgo\] | Alta/Media/Baja | Crítico/Alto/Medio/Bajo | \[Mitigación concreta, no genérica\] |  
| S2 | ... | ... | ... | ... |  
| ... | ... | ... | ... | ... |

Mínimo: 5 riesgos.  
Reportar ANTES de codear. Si durante el sprint se materializa uno, marcar y revisar.  
Si Code identifica un riesgo nuevo (Sn+1), agregarlo y avisar.

BLOQUE E — PARTE 1: VERIFICACIÓN INICIAL  
\=========================================

═══════════════════════════════════════════════════════════════════  
PARTE 1 — Verificación inicial vía MCP (R-PE10)  
═══════════════════════════════════════════════════════════════════

git fetch \--tags  
git describe \--tags \--abbrev=0  \# esperado: vX.Y.Z-fase-sprint  
git log \-1 \--oneline

\-- Queries de verificación de estado de DB  
\[SQL exactos, una query por aspecto a verificar\]  
\[Cada query con comentario corto de qué está chequeando\]

\-- Verificación de módulos activos  
SELECT activo FROM tenant\_modulos   
WHERE tenant\_id='\[UUID\]' AND modulo\_slug='\[slug\]';

\-- Verificación de datos productivos esperados  
SELECT COUNT(\*) AS personas\_actuales FROM personas WHERE tenant\_id='\[UUID\]';

Reportar TODOS los resultados antes de avanzar a PARTE 2\.

BLOQUE F — PARTE 2: CAPA BD (MIGRATIONS)  
\=========================================

═══════════════════════════════════════════════════════════════════  
PARTE 2 — CAPA BD: Migration (con BEGIN/COMMIT explícito)  
═══════════════════════════════════════════════════════════════════

BEGIN;

\-- 2.1 — \[Bloque temático: ej. atributos nuevos\]  
INSERT INTO catalogo\_atributos ...  
ON CONFLICT (slug) DO NOTHING;

\-- 2.2 — \[Bloque temático: ej. constraints\]  
ALTER TABLE personas\_equipos ...

\-- 2.3 — \[Bloque temático: ej. índices\]  
CREATE INDEX IF NOT EXISTS ...

\-- 2.4 — \[Bloque temático: ej. plantillas\]  
INSERT INTO com\_plantillas ...

\-- 2.N — \[Activar módulo si aplica\]  
INSERT INTO tenant\_modulos ... ON CONFLICT ... DO UPDATE ...

COMMIT;

Reglas:  
\- BEGIN/COMMIT explícito en migrations destructivas.  
\- ON CONFLICT DO NOTHING o DO UPDATE según corresponda.  
\- Si una migration podría romper un CHECK constraint existente, dropear y recrear con valores ampliados, no INSERT directo.  
\- Aplicar vía apply\_migration de Supabase MCP (ADR-039).

BLOQUE G — PARTE 3: CAPA CÓDIGO  
\================================

═══════════════════════════════════════════════════════════════════  
PARTE 3 — CAPA CÓDIGO: Estructura del módulo y lógica  
═══════════════════════════════════════════════════════════════════

Estructura esperada:

modules/\[nombre\]/  
├── module.json                ← declarar capabilities/tables/routes  
├── lib/  
│   ├── actions.ts             ← server actions  
│   ├── queries.ts             ← queries server-side  
│   ├── notificaciones.ts      ← lógica de disparo de comunicaciones (si aplica)  
│   ├── permisos.ts            ← checks de permisos (ADR-036 dot-notation)  
│   └── tipos.ts               ← types  
└── ui/  
    ├── \[componente\]-form.tsx  
    ├── \[componente\]-row.tsx  
    ├── \[componente\]-detalle.tsx  
    └── \[componente\]-badge.tsx ← reutilizable si aplica

Por cada archivo principal, incluir bloque de código de referencia con:  
\- Imports esperados  
\- Exports esperados  
\- Lógica en pseudocódigo o esqueleto TypeScript  
\- Comentarios sobre permission checks, mock-first, soft-delete

Reglas:  
\- Server actions únicamente, NO endpoints REST (excepto si está justificado en ADR).  
\- Soft-delete vía deleted\_at (ADR-030).  
\- Permission checks contra catálogo en dot-notation (ADR-036).  
\- Mock-first: cualquier integración externa va mockeada hasta F5 (ADR-035).  
\- Reportar vía MCP, NO CLI local (ADR-039).

BLOQUE H — PARTE 4: INTEGRACIONES (SI APLICA)  
\==============================================

═══════════════════════════════════════════════════════════════════  
PARTE 4 — Integración con módulos existentes  
═══════════════════════════════════════════════════════════════════

Solo si este sprint enchufa con módulos ya operativos.

Por cada módulo integrado, declarar:  
\- Qué se importa (componentes, helpers, queries)  
\- Qué se llama (server actions, eventos)  
\- Qué NO se modifica del módulo existente (defensa contra regresión)

Ejemplo:  
\- Importar \<LesionadoBadge /\> desde modules/salud/ui/ en modules/asistencias/ui/convocatoria.tsx  
\- NO modificar la lógica de convocatoria del módulo asistencias  
\- Agregar query opcional de lesionados al preload del server component

BLOQUE I — PARTE 5: CAPA UI/UX  
\===============================

═══════════════════════════════════════════════════════════════════  
PARTE 5 — CAPA UI/UX: Pantallas, componentes, layouts  
═══════════════════════════════════════════════════════════════════

5.1 — Pantalla \[/admin/ruta/sub-ruta\]

Wireframe ASCII:

\+---------------------------------------------------------------+  
| \[Botón \+Nuevo\]                              \[Filtros: Sede ▼\] |  
\+---------------------------------------------------------------+  
| Tabla:                                                        |  
|   Col1        | Col2       | Col3       | Acciones           |  
|   \--------    | \--------   | \--------   | \-------            |  
|   \[data\]      | \[data\]     | \[data\]     | \[Ver\] \[Editar\]     |  
|   \[data\]      | \[data\]     | \[data\]     | \[Ver\] \[Editar\]     |  
\+---------------------------------------------------------------+

Componentes a usar:  
\- Tabla: DataTable de base-ui  
\- Filtros: Select de base-ui  
\- Acciones: Button variant="ghost" size="sm"

Estados:  
\- Loading: skeleton de la tabla, sin spinner  
\- Empty: empty state con icono \+ texto \+ CTA "Crear primero"  
\- Error: alert destructive con botón "Reintentar"  
\- Success: tabla con datos

5.2 — Modal/Drawer \[Nombre\]

\[Wireframe ASCII del modal\]

Campos del form, con:  
\- Tipo de campo (text, select, date, toggle, textarea)  
\- Validación esperada (required, min/max, regex)  
\- Behavior (autocomplete, default value, dependencias entre campos)

5.3 — Tab \[Nombre\] en ficha \[entidad\]

\[Si aplica: tabs en ficha existente\]  
\[Wireframe ASCII\]

5.4 — data-testids requeridos para E2E

Listado de testids con su selector exacto:  
\- pantalla-\[nombre\]  
\- btn-nuevo-\[entidad\]  
\- modal-\[entidad\]  
\- input-\[campo\]  
\- btn-submit-\[entidad\]  
\- btn-marcar-\[accion\]  
\- (etc.)

BLOQUE J — PARTE 6: CAPA ESTILOS  
\=================================

═══════════════════════════════════════════════════════════════════  
PARTE 6 — CAPA ESTILOS: Design tokens  
═══════════════════════════════════════════════════════════════════

Referencia obligatoria: /docs/DESIGN-SYSTEM.md

Tokens a usar en este sprint:  
\- Colores: usar siempre tokens (--color-primary, \--color-destructive, etc.), nunca hex hardcodeado.  
\- Spacing: escalas del sistema (gap-2, gap-4, gap-6, gap-8), nunca px arbitrarios.  
\- Tipografía: clases del sistema (text-sm, text-base, text-lg, font-semibold), nunca font-size custom.  
\- Sombras: shadow-sm, shadow-md según jerarquía.  
\- Bordes: border, border-2 según jerarquía.

Componentes base permitidos:  
\- shadcn/ui o base-ui (verificar cuál usa el repo)  
\- Lucide icons (no inventar SVGs)  
\- Tailwind utility classes solo del sistema

Patrones de color por estado:  
\- Active/Success: green-100/green-800  
\- Warning: yellow-100/yellow-800  
\- Destructive/Error: red-100/red-800  
\- Info: blue-100/blue-800  
\- Neutral: slate-100/slate-700

NO permitido:  
\- Inline styles  
\- CSS custom global  
\- Colores fuera del sistema

BLOQUE K — PARTE 7: CAPA GALERÍA  
\=================================

═══════════════════════════════════════════════════════════════════  
PARTE 7 — CAPA GALERÍA: Mockups y referencias visuales  
═══════════════════════════════════════════════════════════════════

Por cada pantalla nueva, incluir:

Opción 1 (preferida si existe): Link al mockup en Drive o Figma  
\- URL del mockup  
\- ID del archivo  
\- Notas de diseño relevantes

Opción 2 (fallback): ASCII art del layout  
\- Ya incluido en PARTE 5 con wireframes detallados  
\- Suficiente para Code si no hay mockup formal

Galería de salida:  
\- Code debe screenshot las pantallas nuevas durante los E2E tests (Playwright tiene page.screenshot()).  
\- Los screenshots se suben a Drive en \`\_Verticales/\[vertical\]/galeria/sprint-\[ID\]/\` o \`\_Cierre Ejecutivo/sprint-\[ID\]/\`.  
\- Cada screenshot se referencia en /docs/VISUAL-GALLERY.md con su path.

Si la pantalla se construye en este sprint, los screenshots de cierre alimentan VISUAL-GALLERY.md.

BLOQUE L — PARTE 8: SIDEBAR Y NAVEGACIÓN  
\=========================================

═══════════════════════════════════════════════════════════════════  
PARTE 8 — Sidebar y navegación  
═══════════════════════════════════════════════════════════════════

Si el sprint agrega rutas nuevas:  
\- Sección del sidebar donde van (Troncal / Vertical / Cross-vertical / Marketplace)  
\- Items con label \+ href \+ icono  
\- Posición relativa a items existentes  
\- Permission slug requerido para mostrar (si aplica)

BLOQUE M — PARTE 9: TESTS E2E  
\==============================

═══════════════════════════════════════════════════════════════════  
PARTE 9 — Tests E2E (target X → Y)  
═══════════════════════════════════════════════════════════════════

Por cada test, declarar:  
\- Nombre del test (descriptivo, en español, con verbo)  
\- Setup (fixture data necesaria)  
\- Action (qué hace el test)  
\- Assert (qué verifica)  
\- Cleanup obligatorio en finally (ADR-038)

Esqueleto fijo de cada test:

test('descripcion en lenguaje natural', async ({ page }) \=\> {  
  const supabase \= createServiceRoleClient()  
  let recordId: string | null \= null  
    
  try {  
    // Action  
    await page.goto('/admin/...')  
    await page.getByTestId('btn-...').click()  
    // ...  
      
    // Assert UI  
    await expect(page.getByText('...')).toBeVisible({timeout: 10000})  
      
    // Assert DB  
    const { data } \= await supabase.from('tabla').select('\*').eq('campo', valor)  
    expect(data).toHaveLength(N)  
    recordId \= data\!\[0\].id  
      
  } finally {  
    if (recordId) {  
      await supabase.from('tabla\_dependiente').delete().eq('fk\_id', recordId)  
      await supabase.from('tabla').delete().eq('id', recordId)  
    }  
  }  
})

Reglas:  
\- Mínimo 3 tests, máximo 6\.  
\- Cada test cubre 1 escenario operativo concreto.  
\- Cleanup garantizado siempre, incluso si el assert falla.  
\- Uso de TENANT y PERSONA\_E2E constantes.  
\- Fixtures con metadata.fixture=true para excluir del dedup productivo (ADR-038).  
\- Target count: declarar "N tests al inicio → N+M al cierre" verbatim.

BLOQUE N — PARTE 10: PROTOCOLO DE CIERRE  
\=========================================

═══════════════════════════════════════════════════════════════════  
PARTE 10 — Protocolo de cierre del sprint  
═══════════════════════════════════════════════════════════════════

Al cerrar este sprint, ejecutar EN ESTE ORDEN:

10.1 — Actualizar docs vivos del repo  
\- /docs/CURRENT-STATE.md → sprint \[ID\] cerrado, métricas DB actualizadas, tag nuevo  
\- /docs/SPRINT-PLAN.md → sprint \[ID\] marcado DONE, próximo sprint señalado  
\- /docs/GLOSSARY.md → nuevos términos agregados (si los hay)  
\- /docs/ROADMAP.md → sprint \[ID\] Yellow → Done  
\- /docs/DATA-MODEL.md → tablas/columnas/funciones nuevas (si las hay)  
\- /docs/MODULE-CATALOG.md → módulo nuevo o cambio de estado (si aplica)  
\- /docs/VISUAL-GALLERY.md → screenshots de pantallas nuevas (paths)

10.2 — Commit principal del feature  
git add \[paths del feature\]  
git commit \-m "feat(\[modulo\]): \[descripción corta\] (Sprint \[ID\])"

10.3 — Commit separado de docs  
git add docs/  
git commit \-m "docs: update \[docs tocados\] for Sprint \[ID\]"

10.4 — Tag explícito  
git tag v\[X.Y.Z\]-\[fase\]-sprint\[N\]  
git push origin main \--tags

10.5 — Cierre ejecutivo en Drive  
\- Crear documento "CIERRE-SPRINT-\[ID\]" en Drive \`\_Cierre Ejecutivo/\`  
\- Contenido: métricas del sprint, lo que se construyó, decisiones tomadas, deuda generada, links a commit y deploy  
\- Usar regla R-DOC1: contenido textual del repo o linker, nunca paráfrasis

10.6 — Reporte al arquitecto  
Devolver a Yair con este formato fijo:

\`\`\`  
Sprint \[ID\] cerrado.

Commits:  
\- feat: \[hash\] — \[mensaje\]  
\- docs: \[hash\] — \[mensaje\]  
\- tag: v\[X.Y.Z\]-\[fase\]-sprint\[N\]

Deploy:  
\- Vercel deploy ID: \[dpl\_xxx\]  
\- URL: \[url\]  
\- Estado: READY

Pre-mortem:  
\- Riesgos materializados: \[ninguno | S1 mitigado, S3 materializado y resuelto\]  
\- Riesgos nuevos identificados (Sn+1): \[si los hay\]

Verificación PARTE 1:  
\- \[resumen 1 línea de cada query\]

Tests:  
\- Inicio: N specs  
\- Cierre: N+M specs  
\- Pasando: N+M / N+M  
\- Skipped: 0  
\- Failed: 0

Migration:  
\- Tablas creadas: \[lista\]  
\- Funciones creadas: \[lista\]  
\- Triggers creados: \[lista\]  
\- RLS policies: \[lista\]  
\- Catalogos seedeados: \[lista\]

Desviaciones de scope:  
\- Ninguna | \[Lista con justificación\]

Cierre ejecutivo en Drive:  
\- URL: \[Drive doc\]

Próximo sprint:  
\- \[ID\] \[Nombre\]  
\`\`\`

BLOQUE O — CRITERIOS DE ACEPTACIÓN  
\====================================

═══════════════════════════════════════════════════════════════════  
CRITERIOS DE ACEPTACIÓN  
═══════════════════════════════════════════════════════════════════

Lista numerada con check, todos verificables.

1\. ✅ Pre-mortem PARTE 0 reportado (mínimo 5 riesgos \+ mitigaciones).  
2\. ✅ Verificación inicial PARTE 1 ejecutada y reportada.  
3\. ✅ Migration aplicada sin romper constraints existentes.  
4\. ✅ \[Activo específico del sprint\] creado.  
5\. ✅ \[Activo específico del sprint\] funcional.  
6\. ✅ Permission checks en dot-notation (ADR-036).  
7\. ✅ Mock-first respetado en integraciones externas (ADR-035).  
8\. ✅ Soft-delete vía deleted\_at (ADR-030).  
9\. ✅ Reportes vía MCP, no CLI local (ADR-039).  
10\. ✅ \[N\] E2E tests pasando (target \[N\] specs).  
11\. ✅ Cleanup garantizado en todos los tests con try/finally (ADR-038).  
12\. ✅ Vercel deploy READY.  
13\. ✅ Tag v\[X.Y.Z\]-\[fase\]-sprint\[N\] APLICADO y pusheado.  
14\. ✅ AP-001 a AP-006 vigentes durante todo el sprint.  
15\. ✅ Docs vivos actualizados (PARTE 10.1).  
16\. ✅ Cierre ejecutivo en Drive (PARTE 10.5).  
17\. ✅ Reporte al arquitecto con formato fijo (PARTE 10.6).

Agregar criterios específicos del sprint según corresponda.

BLOQUE P — REGLAS DURAS  
\========================

═══════════════════════════════════════════════════════════════════  
REGLAS DURAS (NO negociables)  
═══════════════════════════════════════════════════════════════════

1\. PARTE 0 (pre-mortem) y PARTE 1 (verificación) son obligatorias antes de codear.  
2\. NO crear tablas nuevas sin justificación explícita en el ALCANCE.  
3\. Permission slugs SIEMPRE en dot-notation (ADR-036). Matchear contra catálogo exacto, sin transformaciones.  
4\. Mock-first universal hasta F5 (ADR-035). Cualquier integración externa va mockeada.  
5\. Soft-delete vía deleted\_at (ADR-030). NO DELETE real desde la app.  
6\. Cleanup en E2E con try/finally garantizado (ADR-038).  
7\. NO romper tests previos. Target verbatim N → N+M.  
8\. Server actions únicamente. NO endpoints REST excepto justificación explícita en ADR.  
9\. APLICAR TAG explícitamente al cerrar.  
10\. Reportar vía MCP de Supabase, GitHub, Vercel (ADR-039). NO CLI local para reportes.  
11\. Si el sprint excede 6h Code, parar y avisar antes de seguir.  
12\. Si se identifica un riesgo nuevo no contemplado en pre-mortem, agregarlo y avisar.  
13\. Si una capa declarada en BLOQUE B no se toca, justificar al cierre. Si una no declarada se toca, parar y avisar.

BLOQUE Q — NO ESTÁ EN ESTE SPRINT  
\==================================

═══════════════════════════════════════════════════════════════════  
NO ESTÁ EN ESTE SPRINT  
═══════════════════════════════════════════════════════════════════

Lista explícita de funcionalidades que NO se construyen, con referencia a la fase futura donde se construirán.

Esto bloquea scope creep y evita que Code "agregue valor" por iniciativa propia.

Ejemplo:  
\- Upload de archivos PDF/imagen de estudios médicos (deuda FASE 11\)  
\- Import masivo CSV de lesiones (satélite 6.5 FASE 11\)  
\- Auto-detección de lesión por IA (FASE 9\)

BLOQUE R — CIERRE FINAL  
\========================

═══════════════════════════════════════════════════════════════════  
CIERRE DE SPRINT — AL TERMINAR  
═══════════════════════════════════════════════════════════════════

Recordatorio final del protocolo (PARTE 10\) en formato resumido:

COMMIT FEATURE:  
\- feat(\[modulo\]): \[descripción corta\] (Sprint \[ID\])

COMMIT DOCS (separado):  
\- docs: update \[docs tocados\] for Sprint \[ID\]

TAG:  
\- v\[X.Y.Z\]-\[fase\]-sprint\[N\]

CIERRE EN DRIVE:  
\- CIERRE-SPRINT-\[ID\] en \`\_Cierre Ejecutivo/\`

REPORTE AL ARQUITECTO (formato PARTE 10.6):  
\- Hashes  
\- Deploy ID  
\- Pre-mortem outcome  
\- Verificación PARTE 1  
\- Test counts  
\- Migration changes  
\- Desviaciones  
\- Próximo sprint

RESUMEN DE LA ESTRUCTURA (REFERENCIA RÁPIDA)  
\=============================================

A. CONTEXTO OBLIGATORIO (qué leer antes)  
B. DECLARACIÓN DE CAPA (checkboxes de 5 capas)  
C. HEADER DE SPRINT (objetivo \+ alcance \+ dependencias)  
D. PARTE 0 — PRE-MORTEM (R-PE9)  
E. PARTE 1 — VERIFICACIÓN INICIAL (R-PE10)  
F. PARTE 2 — CAPA BD (migrations)  
G. PARTE 3 — CAPA CÓDIGO (estructura \+ lógica)  
H. PARTE 4 — INTEGRACIONES (si aplica)  
I. PARTE 5 — CAPA UI/UX (pantallas \+ componentes \+ wireframes ASCII)  
J. PARTE 6 — CAPA ESTILOS (design tokens)  
K. PARTE 7 — CAPA GALERÍA (mockups \+ screenshots de cierre)  
L. PARTE 8 — SIDEBAR Y NAVEGACIÓN  
M. PARTE 9 — TESTS E2E (target X → Y)  
N. PARTE 10 — PROTOCOLO DE CIERRE (10.1 a 10.6)  
O. CRITERIOS DE ACEPTACIÓN  
P. REGLAS DURAS  
Q. NO ESTÁ EN ESTE SPRINT  
R. CIERRE FINAL (recordatorio)

CHECKLIST DE VALIDACIÓN ANTES DE PEGAR A CODE  
\==============================================

Antes de pegar un prompt a Claude Code, validar que cumple:

\[ \] Tiene los 18 bloques (A a R) en orden.  
\[ \] Bloque A (contexto obligatorio) lista 6+ docs a leer.  
\[ \] Bloque B (declaración de capa) declara las 5 capas con \[x\] o \[ \].  
\[ \] Bloque C (header) tiene Objetivo, Alcance SÍ, Alcance NO, Dependencias.  
\[ \] PARTE 0 lista mínimo 5 riesgos con mitigación concreta.  
\[ \] PARTE 1 incluye queries SQL verbatim para verificar estado.  
\[ \] PARTE 2 usa BEGIN/COMMIT explícito.  
\[ \] PARTE 3 detalla estructura modules/X/ con árbol y código de referencia.  
\[ \] PARTE 5 incluye wireframes ASCII por pantalla.  
\[ \] PARTE 5 declara data-testids requeridos.  
\[ \] PARTE 6 referencia DESIGN-SYSTEM.md y enumera tokens.  
\[ \] PARTE 7 declara dónde se suben screenshots al cierre.  
\[ \] PARTE 9 tiene N tests con esqueleto try/finally.  
\[ \] PARTE 10 lista 7 docs vivos a actualizar.  
\[ \] Criterios de aceptación tiene mínimo 15 items.  
\[ \] Reglas duras incluyen referencias a ADR-030, 035, 036, 038, 039\.  
\[ \] NO ESTÁ EN ESTE SPRINT tiene mínimo 3 items pospuestos con fase futura.

Si algún \[ \] queda vacío, completar antes de pegar a Code.

ÚLTIMA ACTUALIZACIÓN  
\=====================

13 de mayo de 2026\. Versión 1.0.  
Próxima revisión: tras ejecutar Sprint A1 (validar que el template funciona en práctica).  
