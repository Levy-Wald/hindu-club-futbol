# Reporte de Testing + Code Health — hindu-v2

**Fecha:** 2026-05-26
**Tag:** `v0.35.1-a4.2-ui-fixes`

---

# PARTE 1: TESTING

## 1. Resultado de unit tests (`pnpm run test:unit`)

| Metrica | Valor |
|---------|-------|
| Framework | **Vitest 4.1.6** |
| Test suites | 9 passed, **1 failed**, 10 total |
| Tests | **137 passed**, 0 failed |
| Duracion | 305ms (transform 531ms, setup 0ms, import 638ms, tests 35ms) |

**Suite fallido:** `tests/unit/permissions/capabilities.test.ts`
- **Causa:** Error de import — `Cannot find package '@/lib/tenant'`
- No es un test roto, es un problema de resolucion de alias `@/` en Vitest (falta config de alias o vitest.config.ts)
- Los 0 tests de esa suite nunca llegaron a ejecutarse

## 2. Coverage

**No hay coverage configurado.** No existe `vitest.config.ts`, `vite.config.ts`, ni configuracion de `coverage` en `package.json`. Vitest corre con defaults inline.

## 3. Frameworks de test

| Framework | Uso | Archivos |
|-----------|-----|----------|
| **Vitest 4.1.6** | Unit tests | 10 archivos en `tests/unit/` |
| **Playwright 1.59.1** | E2E tests | 26 archivos en `tests/e2e/` |

## 4. Conteo de archivos de test

| Patron | Cantidad |
|--------|----------|
| `*.test.*` | 10 (unit, Vitest) |
| `*.spec.*` | 26 (E2E, Playwright) |
| **Total** | **36 archivos de test** |

### Desglose E2E specs:
- `tests/e2e/modules/` — 16 specs (acceso, amistosos, asistencias, comunicaciones, concesiones, entrenamientos, equipos, nominas-externas, notificaciones, planificadores, pre-inscripciones, reservas, rrhh, salud, tactica, torneos, utileria)
- `tests/e2e/troncal/` — 3 specs (finanzas, personas, proyectos)
- `tests/e2e/sprints/` — 3 specs (a1-fix-base-operativa, h2-erp-modular, h5-vertical-ccbp)
- `tests/e2e/` (raiz) — 4 specs (mi-dia, navigation, sidebar-recovery, acceso)

### Desglose unit tests:
- `tests/unit/dashboard/` — should-show-widget
- `tests/unit/eventos/` — invitaciones
- `tests/unit/finanzas/` — auto-match, resolver-cuentas
- `tests/unit/navigation/` — filter
- `tests/unit/permissions/` — can-helpers, capabilities
- `tests/unit/pim/` — movimientos-stock, precio-vigente
- `tests/unit/` — fixture-generators

## 5. Tests E2E

**Si.** 26 specs Playwright.

- **Target:** Produccion real (Vercel deploy). Configurado via `dotenv` cargando `.env.local` que contiene la URL de produccion.
- **No corren en CI.** Segun ADR-053, E2E no esta en el pipeline de CI.
- **Script:** `pnpm run test:e2e` ejecuta Playwright con env vars de `.env.local`.

## 6. Tests de integracion contra DB

**No hay tests de integracion contra Supabase local.** Los E2E corren contra produccion/staging real. No hay `supabase start` en scripts, no hay fixture de DB local, no hay test containers.

---

# PARTE 2: CODE HEALTH — Analisis de patrones

## 1. Optional chaining triple (`?.x?.y?.z`)

| Cantidad | **0** |
|----------|-------|

Excelente. No hay optional chaining profundo en el codigo.

## 2. Type escape hatches

| Patron | Cantidad | Severidad |
|--------|----------|-----------|
| `as any` | **84** | Alta |
| `as unknown as` | **103** | Media (documentado en CLAUDE.md como patron para FK joins) |
| `@ts-ignore` | **0** | - |
| `@ts-expect-error` | **0** | - |
| **Total** | **187** | |

### `as any` — Top clusters:
- `app/admin/[tenant]/(troncal)/configuracion/usuarios/` — 6 usos: Supabase client casteado para tablas no tipadas en el schema generado
- `app/admin/[tenant]/(troncal)/configuracion/_components/tenant-form.tsx` — 3 usos: acceso a `tenant.configuracion` (campo jsonb sin tipo)
- `modules/rrhh/` — liquidaciones y contratos pasados como `any` a componentes
- Formularios varios donde data de Supabase no matchea tipos generados

### `as unknown as` — Contexto:
Es el patron canonizado del proyecto para FK joins de PostgREST que devuelven arrays en vez del tipo esperado (documentado en CLAUDE.md). La mayoria esta en pages de `app/admin/[tenant]/` donde se hacen queries con `.select('*, relacion(*)')`.

## 3. useEffect

| Metrica | Valor |
|---------|-------|
| Total `useEffect` | **117** |
| Archivos con useEffect | **80** |
| Promedio por archivo | 1.46 |

No se detectaron useEffect sin dependencias sospechosos (el grep no encontro patrones de `useEffect(() => {...})` sin segundo argumento — todos tienen deps declaradas).

## 4. console.log en codigo de aplicacion

| Cantidad | **2** |
|----------|-------|
| Archivo | `modules/comunicaciones/lib/adapters/mock-adapter.ts` |

Ambos estan en el **mock adapter** de comunicaciones (mock-first, ADR-035). Aceptable — es logging intencional del mock.

## 5. TODO / FIXME / HACK / XXX

| Tag | Cantidad |
|-----|----------|
| `TODO` | **7** |
| `FIXME` | 0 |
| `HACK` | 0 |
| `XXX` | 3 |
| **Total** | **10** |

### TODOs relevantes:
| Archivo | TODO |
|---------|------|
| `app/admin/scl/layout.tsx:19` | `TODO: Tramo 8 — verificar rol admin_scl o superadmin` |
| `modules/comunicaciones/lib/preferencias/defaults.ts:28` | `TODO FASE 12: timezone por tenant` |
| `modules/entrenamientos/ui/lista-bloques.tsx:144` | `TODO: modal editar` |

Los demas son falsos positivos (strings con la palabra TODO como parte de contenido, no comentarios de deuda tecnica).

## 6. Componentes/archivos mayores a 300 lineas

**Total: 90 archivos superan las 300 lineas.**

### Top 20 archivos mas grandes:

| # | Lineas | Archivo |
|---|--------|---------|
| 1 | **2,194** | `app/admin/[tenant]/(troncal)/finanzas/cuotas/_components/cuotas-client.tsx` |
| 2 | **1,495** | `modules/equipos/ui/components/horarios-panel.tsx` |
| 3 | **1,486** | `modules/pim/lib/actions.ts` |
| 4 | **1,338** | `lib/navigation/sidebar-items.ts` |
| 5 | **1,268** | `app/.../personas/[id]/_components/secciones/salud.tsx` |
| 6 | **1,231** | `app/.../configuracion/branding/_components/branding-form.tsx` |
| 7 | **1,148** | `lib/imports/actions.ts` |
| 8 | **1,002** | `modules/salud/ui/components/salud-client.tsx` |
| 9 | **920** | `app/.../mi-equipo/_components/mi-equipo-client.tsx` |
| 10 | **910** | `app/.../mi-cuenta/_components/mi-cuenta-client.tsx` |
| 11 | **903** | `app/(public)/page.tsx` |
| 12 | **900** | `app/(public)/asociate/_components/form-inscripcion.tsx` |
| 13 | **867** | `modules/finanzas/lib/actions.ts` |
| 14 | **843** | `modules/comunicaciones/lib/actions.ts` |
| 15 | **727** | `modules/finanzas/lib/cuotas.ts` |
| 16 | **727** | `app/.../personas/_actions.ts` |
| 17 | **721** | `modules/concesiones/lib/actions.ts` |
| 18 | **695** | `modules/pre_inscripciones/ui/components/pre-inscripciones-client.tsx` |
| 19 | **695** | `app/.../finanzas/conciliacion/_components/conciliacion-client.tsx` |
| 20 | **690** | `modules/finanzas/lib/conciliacion.ts` |

### Distribucion por rango:
| Rango | Cantidad |
|-------|----------|
| 300-500 lineas | 52 archivos |
| 500-1000 lineas | 30 archivos |
| 1000+ lineas | **8 archivos** |

### Archivos criticos (1000+ LOC):
Estos 8 archivos concentran complejidad y deberian priorizarse para split:
1. `cuotas-client.tsx` (2,194) — UI monolitica de gestion de cuotas
2. `horarios-panel.tsx` (1,495) — Calendario semanal completo
3. `pim/actions.ts` (1,486) — Todas las server actions de PIM en 1 archivo
4. `sidebar-items.ts` (1,338) — Catalogo de 103 items de navegacion (data, no logica)
5. `salud.tsx` (1,268) — Seccion salud de persona
6. `branding-form.tsx` (1,231) — Formulario de branding completo
7. `imports/actions.ts` (1,148) — Motor de importacion
8. `salud-client.tsx` (1,002) — UI de modulo salud

## 7. Funciones mayores a 100 lineas

Los archivos de 1000+ LOC de la seccion anterior necesariamente contienen funciones grandes. Los principales offenders son:
- Server action files (`actions.ts`) donde cada action es 50-150 lineas y hay 8-15 actions por archivo
- Client components monoliticos que mezclan estado, handlers y JSX en un solo componente

## 8. Imports relativos profundos (`../../../`)

| Cantidad | **3** |
|----------|-------|

| Archivo | Import |
|---------|--------|
| `app/.../padrones/[id]/sync/[runId]/page.tsx` | `../../../_lib/queries` |
| `app/.../personas/[id]/_components/secciones/shared.tsx` | `../../../_lib/schemas` |
| `app/.../personas/[id]/_components/secciones/ficha-total.tsx` | `../../../_lib/schemas` |

Excelente. El alias `@/` se usa consistentemente. Solo 3 excepciones, todas dentro de la misma ruta de `app/admin/[tenant]/` donde el import relativo va a un `_lib/` del mismo modulo de ruta.

---

# RESUMEN EJECUTIVO

## Salud del testing

| Aspecto | Estado | Nota |
|---------|--------|------|
| Unit tests | 137 green, 1 suite broken | Fix: alias `@/` en vitest config |
| E2E tests | 26 specs, no en CI | Corren contra prod, manual |
| Coverage | **No configurado** | Sin metricas de cobertura |
| Integration tests | **No hay** | No hay tests contra Supabase local |
| Test ratio | 36 archivos test / 834 archivos codigo = **4.3%** | Bajo |

## Salud del codigo

| Aspecto | Estado | Nota |
|---------|--------|------|
| `as any` | 84 | Deuda media, concentrada en FK joins y jsonb |
| `as unknown as` | 103 | Patron canonizado (PostgREST FK), aceptable |
| `@ts-ignore` | 0 | Excelente |
| Triple `?.` | 0 | Excelente |
| console.log | 2 | Solo en mock adapter, OK |
| TODOs | 7 reales | Bajo, controlado |
| Deep imports | 3 | Excelente, `@/` bien adoptado |
| Archivos 1000+ LOC | **8** | Candidatos a split |
| Archivos 300+ LOC | **90** | 10.8% del total — zona de atencion |
