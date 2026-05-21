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

## NO incluido en este sprint

- 57 DUDA (thin wrappers) — muestreo 80% OK, no justifica pase exhaustivo
- 2 REDISENO SEPARADO (eventos hub, partidos hub) — requieren rediseno como tabs
- 3 DIFERIR (configuracion avanzado, mi-cuenta placeholders)
- 3 TOCAR menores del muestreo (movimientos read-only, concesionario detalle, pre-inscripciones)
