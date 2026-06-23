# RFC-006 — Navegación data-driven (end-state: tabla de items de sidebar)

> Espejo de Drive `_Arquitectura/RFC-006 v2 — Navegación data-driven (end-state, tabla sidebar_items)` (+ RFC-006 v1). Fuente de verdad allí.
> Este archivo recoge la **v2 (end-state)**, que es lo implementado en F1.6. La v1 quedó superseded (ver Historia).

**Estado**: Aprobado (opción 3, end-state) por Yair — implementado en F1.6
**Fecha**: 01-jun-2026
**Autor**: Dirección Externa (Opus)
**Milestone**: F1

## Historia — por qué v2 (corrección de v1)

La **v1** asumió que `catalogo_modulos` alcanzaba para dibujar todo el sidebar con sus columnas de agrupación (`area_sidebar_bo`, `sub_area_sidebar_bo`, `nombre_display`, `orden`). **Falso** (verificado por Code y Opus, 01-jun):
- `catalogo_modulos` NO tiene ruta (href), NO tiene icono, NO tiene capability requerida.
- Es 1 fila por **módulo** (91). El sidebar real es 1 fila por **link** (102 items): un módulo genera varios links (ej. finanzas → 6) y hay 29 links "core" que no son módulos (Inicio, Mi perfil, Mi equipo, sub-ítems de Configuración).

Conclusión: no se puede generar el sidebar **solo** desde `catalogo_modulos`. v1 descartada; Yair elige el end-state correcto (opción 3): crear una tabla de items de navegación y migrar a ella el catálogo hardcodeado.

## 1. Hallazgo clave (lo que vuelve esto barato)

El archivo `lib/navigation/sidebar-items.ts` ya contiene `SIDEBAR_CATALOG`: 102 items, cada uno con todo lo que falta en la base — `id, label, href, icon, capa, estado ('activo'|'proximamente'), modulo_slug (opcional), capability_requerida (opcional), espacio, grupo, orden, nota, badge, vertical_filter`.

Distribución: configuracion 38, actividad 21, personas 14, recursos 12, inicio 9, finanzas 6, marketing 2. 73 items con `modulo_slug`, 30 con `capability_requerida`, 37 `'proximamente'`, 29 links core sin módulo.

⇒ La migración NO es autoría de datos desde cero. Es **mover 102 items** de un archivo TS a una tabla, 1:1. El dato ya existe y está curado.

## 2. Decisión (opción 3 — end-state data-driven real)

Crear tabla `sidebar_items` (catálogo de navegación, nivel link, no nivel módulo) y poblarla con los 102 items del `SIDEBAR_CATALOG` actual. El sidebar pasa a renderizarse 100% desde esa tabla. `sidebar-items.ts` se elimina al cierre. `catalogo_modulos` NO se modifica: queda como catálogo de módulos (capa, billing, activación por tenant); `sidebar_items` lo referencia por `modulo_slug` cuando aplica.

## 3. Modelo propuesto

**3.1. Tabla `sidebar_items`** (nueva, espejo 1:1 del type `SidebarItem`):
- `id` (text), **sin `tenant_id`** — es catálogo global del producto (igual que `catalogo_modulos`). Override por tenant = tabla aparte futura.
- `label, href, icon, capa, estado ('activo'|'proximamente')`
- `modulo_slug` (FK lógica a `catalogo_modulos.slug`, nullable → los 29 core van null)
- `capability_requerida` (nullable → filtro b)
- `espacio` (área nivel 1: inicio/personas/actividad/marketing/finanzas/recursos/configuracion), `grupo` (sub-área nivel 2)
- `orden` (int), `nota` (nullable), `badge` (nullable), `vertical_filter` (array nullable)
- `activo` (bool), `created_at`, `updated_at`, `metadata`

> `espacio`/`grupo` aquí son los del `sidebar-items.ts` actual (que respeta el orden de Yair), NO los `area_sidebar_bo` de `catalogo_modulos`. Dos taxonomías que conviven; en `sidebar_items` manda la del sidebar real. Reconciliarlas es deuda futura.

**3.2. Seed**: INSERT de los 102 items leídos de `SIDEBAR_CATALOG` (Code los porta directo, sin reinterpretar). Idempotente por `id`.

**3.3. Render**: `NavSidebar` / `SidebarGroup` / `SidebarItem` (ya existen) pasan a leer de `sidebar_items` en lugar de importar `SIDEBAR_CATALOG`. La forma del dato es la misma.

## 4. Pipeline de render

`sidebar_items` (102 links) → filtro (a) por `modulo_slug` activo en `tenant_modulos` (items sin `modulo_slug` = core, siempre visibles) → filtro (b) por `capability_requerida` vs capabilities del usuario (admin saltea) → filtro (c) estado: `'proximamente'` se muestra deshabilitado/badge, no se oculta. Todo server-side.

## 5. Contrato para Claude Code

- **5.1.** Migración: crear tabla `sidebar_items` (columnas de 3.1). RLS (lectura usuarios autenticados; escritura solo service-role/admin SCL). Catálogo global, sin `tenant_id`.
- **5.2.** Seed idempotente: portar los 102 items, 1:1, sin reinterpretar labels/orden/grupos.
- **5.3.** Reescribir el data layer (`lib/cache.ts` `getCachedSidebarModules` o equivalente) para armar el sidebar desde `sidebar_items`. Filtros (a)(b)(c) server-side; admin ve todo.
- **5.4.** Eliminar `SIDEBAR_CATALOG` de `sidebar-items.ts` (dejar solo el type, movido a `types.ts`).
- **5.5.** Generar tipos TS desde la tabla.
- **5.6.** Cambio de UI mayor → smoke visual de Yair OBLIGATORIO + preview Vercel READY antes de tag. Si no se autoverifica: "DONE técnico, esperando smoke humano", NO taguear.

**Criterio de paridad (clave)**: el set de links renderizado tras la migración debe ser IDÉNTICO al de hoy (mismos 102 items, mismo orden, grupos y estados). Verificable: comparar el render nuevo contra `SIDEBAR_CATALOG` antes de borrarlo.

## 6. Gaps / decisiones

- **6.1.** Dos taxonomías de agrupación coexisten: la de `sidebar-items.ts` (espacio/grupo, 7 espacios, la que se ve) y la de `catalogo_modulos` (`area_sidebar_bo`, 8 áreas incl. admin_scl). Este RFC usa la del sidebar real. Reconciliar = deuda futura.
- **6.2.** `nombre_display` de `catalogo_modulos` (91/91) queda como label de módulo para otras vistas; `sidebar_items.label` es el label del LINK. Pueden diferir legítimamente.
- **6.3.** Override por tenant: fuera de scope.
- **6.4.** Portal del socio (`area_sidebar_pc`): F3.

## 7. Reparto de actores

- **Opus**: dueño del diseño de datos. Verifica por MCP que `sidebar_items` quede con 102 filas y render = paridad. Canoniza como ADR al cierre.
- **Code**: migración + seed (102) + reescritura del data layer + borrado de `SIDEBAR_CATALOG` + tipos. UI → smoke de Yair.
- **Supabase**: tabla `sidebar_items` nueva; `catalogo_modulos` intacto.
- **Zoho**: actualizar SE1-T92 (F1.6) a este alcance (end-state, no híbrido).
- **Yair**: smoke visual en producción (menú igual que hoy).

## 8. Criterios de cierre

- Tabla `sidebar_items` con 102 filas. Verificado por Opus vía MCP.
- Sidebar renderizado desde la tabla; paridad exacta con el de hoy.
- Filtro (a) módulo inactivo oculta; (b) capability oculta; admin ve todo; (c) `'proximamente'` deshabilitado.
- `SIDEBAR_CATALOG` eliminado del código.
- tsc + build OK + preview READY + smoke visual Yair.
