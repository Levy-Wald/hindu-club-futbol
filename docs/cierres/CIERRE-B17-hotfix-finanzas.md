# CIERRE B17 — Hotfix UI + Auto-imputacion contable

**Fecha:** 2026-05-21

## Scope

6 fixes de UI + auto-imputacion contable en un unico commit.

## Archivos modificados

### Fix 1 — Select modal "Nueva cuenta" en plan-cuentas

**Archivo:** `app/admin/[tenant]/(troncal)/finanzas/plan-cuentas/_components/cuenta-form-dialog.tsx`

- **Causa raiz:** `Select` importado de `@/components/ui/select` es `SelectPrimitive.Root` (Base UI headless) pero se usaba con `<option>` nativas. No renderizaba dropdown.
- **Fix:** Reescrito 3 Selects (tipo, cuenta padre, moneda) con composicion correcta: `SelectTrigger` + `SelectContent` + `SelectItem`.

### Fix 2 — Select "Abrir periodo" en periodos

**Archivo:** `app/admin/[tenant]/(troncal)/finanzas/periodos/_components/nuevo-periodo-dialog.tsx`

- **Causa raiz:** Mismo bug que Fix 1. Select de mes no renderizaba, no enviaba valor en FormData.
- **Fix:** Reescrito con `SelectTrigger` + `SelectContent` + `SelectItem`.

### Fix 3 — revalidatePath con ruta dinamica [tenant]

**Archivos (7):**
- `modules/finanzas/lib/actions.ts` — 15 ocurrencias
- `modules/finanzas/lib/cuotas.ts` — 10 ocurrencias
- `modules/finanzas/lib/conciliacion.ts` — 8 ocurrencias
- `modules/finanzas/lib/suscripciones.ts` — 4 ocurrencias
- `modules/finanzas/lib/centros-costo.ts` — 4 ocurrencias
- `modules/membresias/lib/actions.ts` — 4 ocurrencias

- **Causa raiz:** Desde B13.2 (ruteo dinamico `[tenant]`), todas las rutas viven en `/admin/[tenant]/...` pero los `revalidatePath` seguian usando `/admin/finanzas/...` sin el segmento tenant. Next.js no matcheaba, las paginas no refrescaban post-mutacion.
- **Fix:** Todas las llamadas actualizadas a `revalidatePath('/admin/[tenant]/finanzas/...', 'page'|'layout')`.

### Fix 4 — Dashboard links → dialogs

**Archivos:**
- `app/admin/[tenant]/(troncal)/finanzas/page.tsx` — fetch adicional + reemplazo de Card
- `app/admin/[tenant]/(troncal)/finanzas/_components/finanzas-quick-actions.tsx` — NUEVO
- `app/admin/[tenant]/(troncal)/finanzas/movimientos/_components/nuevo-movimiento-dialog.tsx` — props extended
- `app/admin/[tenant]/(troncal)/finanzas/movimientos/_components/movimiento-form.tsx` — `tipoInicial` prop

- **Causa raiz:** 4 botones (Nuevo Ingreso, Nuevo Egreso, Transferencia, Emitir Cuotas) linkeaban a rutas inexistentes (`/movimientos/nuevo`, `/transferencias/nueva`, `/cuotas/emitir`).
- **Fix:** Botones ahora abren dialogs en la misma pagina. `NuevoMovimientoDialog` acepta `tipoInicial` y controlled open/onChange. `FinanzasQuickActions` client component maneja 3 dialogs (ingreso, egreso, transferencia). "Emitir Cuotas" linkea a `/finanzas/cuotas` (no existe dialog standalone — la emision vive como tab embebida en cuotas-client.tsx).

### Fix 5 — Sidebar items "proximamente"

**No se requirio cambio.** El componente `SidebarItem.tsx` ya maneja correctamente los items con `estado: 'proximamente'`:
- Se renderizan como `<button>` (no `<Link>`)
- Tienen `opacity-60`
- Muestran badge "Pronto"
- Al clickear abren `ProximamenteModal`

Los items de disciplinas (`disc-futbol`, etc.) ya estan marcados `proximamente` en `sidebar-items.ts` y se renderizan correctamente.

### Fix 6 — Auto-imputacion contable

**Archivo:** `modules/finanzas/lib/actions.ts` (funcion `crearMovimiento`)

- **Antes:** Solo auto-resolvia cuentas contables si habia `productoId` (via `resolverCuentasMovimiento`).
- **Despues:** Si no se resolvio por producto ni manualmente, intenta auto-imputar:
  - **Ingreso/Egreso:** Busca `catalogo_categorias_movimiento.cuenta_contable_id` + `cajas.cuenta_id`. Ingreso: debe=caja, haber=categoria. Egreso: debe=categoria, haber=caja.
  - **Transferencia:** Busca `cajas.cuenta_id` de origen y destino. Debe=destino, haber=origen.
  - Si caja o categoria no tiene cuenta contable → warning en log + deja en NULL (no rompe, solo no imputa).

## Verificacion

- `pnpm tsc --noEmit` — sin errores
- `pnpm run build` — OK
- `pnpm run test:unit` — 83 passed, 1 file fallo pre-existente (capabilities.test.ts, no relacionado)

## Notas

- **Emitir Cuotas dialog no existe** como componente standalone. La emision vive como tab embebida en `cuotas-client.tsx` (1400+ LOC). Se linkea a `/finanzas/cuotas` como workaround.
- **revalidatePath global:** Se arreglaron TODAS las ocurrencias en el modulo finanzas + membresias (45+ llamadas), no solo las de periodos. Todas tenian el mismo bug desde B13.2.
