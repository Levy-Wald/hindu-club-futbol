# CIERRE B15 — Action Bars Uniformes

**Fecha:** 2026-05-21
**Tag previo:** v0.30.21-b14-gaps-pre-fase-c

## Scope

Mover action bars al patron canonico (arriba derecha, alineado al titulo) en 3 archivos identificados en el inventario B15.1.

## Archivos modificados (exactamente 3)

### 1. `padrones/[id]/sync/nuevo/page.tsx`

- **Antes:** Boton "Iniciar sincronizacion" era un `<Button type="submit" className="w-full">` al fondo del formulario dentro del Card.
- **Despues:** Boton movido al header row junto al titulo. Usa `form.requestSubmit()` para triggear el submit. El form conserva un `<button type="submit" className="hidden">` para mantener la semantica HTML. Misma logica disabled/loading/labels.

### 2. `padrones/[id]/importar/_components/step-results.tsx`

- **Antes:** "Importar mas datos" y "Ver padron" en `flex justify-between` al pie de la pagina (L78).
- **Despues:** Ambos botones movidos al header, alineados a la derecha del titulo/icono de estado via `flex items-start justify-between`. Se usa `size="sm"` para no competir visualmente con el status icon. En mobile, colapsan debajo del titulo via `flex-wrap`.

### 3. `finanzas/cajas/[id]/page.tsx`

- **Antes:** "Nuevo movimiento" en `flex justify-end` independiente debajo de las 3 stat cards (L300-306).
- **Despues:** Boton movido al header row existente (`ml-auto flex items-center gap-2`), antes de "Editar" y CajaDetailActions. Solo visible si la caja no esta eliminada (`!isDeleted`). Div standalone eliminado.

## Verificacion

- `pnpm tsc --noEmit` — sin errores
- `pnpm run build` — OK
- `pnpm run test:unit` — 83 passed, 1 file fallo pre-existente (capabilities.test.ts, import @/lib/tenant en Vitest, no relacionado)

## B15.1b — Inspeccion profunda DUDAs (2026-05-21)

63 DUDAs inspeccionadas exhaustivamente. Resultado: 25 OK, 33 EXCEPCION, 5 TOCAR (scope B15.3).

## B15.3 — Cierre final action bars (2026-05-21)

5 ocurrencias en 3 componentes unicos. Todos tenian el boton primario (save/submit) al pie del formulario.

### 1. `finanzas/config/_components/config-form.tsx` (ConfigFinancieraForm)

- **Antes:** "Guardar configuracion" en `<div className="flex justify-end">` al fondo del form multi-card. Header con titulo vivia en el page wrapper server.
- **Despues:** Header (icono + titulo + boton) movido dentro del form component. Boton `type="submit"` en header row via `flex justify-between`. Page wrapper simplificado a solo render del form.

### 2. `comunicaciones/ui/automatizacion-form.tsx` (AutomatizacionForm)

- **Antes:** "Guardar cambios"/"Crear automatizacion" + "Cancelar" en `flex items-center gap-3` al fondo, despues del Card.
- **Despues:** Ambos botones movidos al header row existente (que ya tenia back arrow + h1). Titulo gana `flex-1`, botones alineados a la derecha con `size="sm"`.
- **Afecta:** `comunicaciones/automatizaciones/nueva/page.tsx`

### 3. `comunicaciones/ui/plantilla-editor-form.tsx` (PlantillaEditorForm)

- **Antes:** 5 botones (Guardar, Test send, Cancelar, Duplicar, Eliminar) en `flex flex-wrap gap-3` al fondo de la columna izquierda, debajo del Card del editor.
- **Despues:** Todos los botones movidos al header row. Layout `flex items-start justify-between flex-wrap`. Orden mantenido: Save (primario) → Test send → Cancelar → Duplicar → Eliminar. Todos `size="sm"`. En mobile colapsan debajo del titulo.
- **Afecta:** `comunicaciones/plantillas/[id]/editar/page.tsx` Y `comunicaciones/plantillas/nueva/page.tsx`

### 4. `proyectos/ui/proyecto-form.tsx` (ProyectoForm)

- **Antes:** "Crear proyecto" como `<Button type="submit">` suelto al fondo del form, despues de los campos. Titulo vivia en el page wrapper server.
- **Despues:** Header row con titulo dinamico (Nuevo/Editar) + boton submit via `flex justify-between`. Page wrapper simplificado a solo render del form.
- **Afecta:** `proyectos/nuevo/page.tsx`

## Verificacion B15.3

- `pnpm tsc --noEmit` — sin errores
- `pnpm run build` — OK
- `pnpm run test:unit` — 83 passed, 1 file fallo pre-existente (capabilities.test.ts, no relacionado)

## Inventario final B15

| Categoria | Total |
|-----------|-------|
| OK | 69 |
| TOCAR ejecutado (B15.2 + B15.3) | 8 |
| EXCEPCION | 43 |
| DIFERIR | 2 |
| REDISENO SEPARADO | 2 |
| DUDA | 0 |
