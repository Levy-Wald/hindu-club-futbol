# B17 — Diagnostico Bugs Nivel A

**Fecha:** 2026-05-21

## Tabla resumen

| Item | Causa raiz | Fix propuesto | Estimacion |
|------|-----------|---------------|------------|
| 1 — Links rotos finanzas (4 URLs) | No existen los `page.tsx` en las 3 rutas. Los forms SI existen como componentes internos (dialog/tab) | Crear 3 page.tsx wrapper que reusen componentes existentes (`MovimientoForm`, emission tab de `cuotas-client`) | 3 archivos nuevos, ~30 lineas c/u |
| 2 — /conciliacion cascara vacia | **NO es bug.** Modulo 100% funcional: 696 LOC client + 691 LOC server actions, import CSV/XLSX, auto-match, conciliacion manual, discrepancias | Ninguno — funciona. Si Yair ve vacio es porque no hay caja bancaria seleccionada o no importo extracto | 0 archivos |
| 3 — /reportes/libro-mayor botones muertos | UI completa y conectada. Buscar/PDF/Excel todos wired. La vista `v_libro_mayor` existe en BD (verificada 1.16ms) pero NO tiene migration local. Si falla es por RLS o falta de datos | Verificar via MCP que la vista existe y tiene RLS correcto. Si OK → no hay fix de codigo | 0-1 archivos (migration si falta) |
| 4 — Modal nueva cuenta: Select cuenta padre roto | `Select` de `@/components/ui/select` es `SelectPrimitive.Root` (Base UI headless) pero se usa con `<option>` nativas — no renderiza dropdown. Mismo bug en TODOS los Select del dialog (tipo, cuenta padre, moneda) | Reescribir los 3 Select del dialog con `SelectTrigger`+`SelectContent`+`SelectItem`. Agregar `max-h-[85dvh] overflow-y-auto` al `DialogContent` global | 1 archivo (cuenta-form-dialog.tsx) + 1 linea en dialog.tsx |
| 5A — Periodo: Select mes no funciona | Mismo bug que Item 4: `Select` (Base UI Root) con `<option>` nativas. No renderiza, no envia valor en FormData | Reescribir Select con composicion correcta (`SelectTrigger`+`SelectContent`+`SelectItem`) + estado local + hidden input para FormData | 1 archivo (nuevo-periodo-dialog.tsx), ~20 lineas |
| 5B — Periodo: cerrar sin feedback visual | `revalidatePath('/admin/finanzas')` no matchea ruta dinamica `/admin/[tenant]/finanzas/periodos`. Toast SI existe pero la tabla no refresca, dando impresion de "nada paso" | Cambiar revalidatePath a `'/admin/[tenant]/finanzas/periodos'` en `cerrarPeriodo`, `abrirPeriodo`, `reabrirPeriodo` | 1 archivo (actions.ts), 3 lineas |
| 6 — /disciplinas/futbol 404 | No existe `disciplinas/[slug]/page.tsx` ni `disciplinas/page.tsx`. El sidebar apunta a `/admin/disciplinas` (sin slug). `catalogo_disciplinas` vive en ruta generica `/catalogos/disciplinas` | Opcion A: redirect disciplinas→catalogos/disciplinas. Opcion B: quitar items del sidebar (estan marcados `proximamente`). Opcion C: crear page placeholder | 1 archivo (sidebar o redirect) |

## Detalle por item

### Item 1 — Links rotos finanzas

**Origen de los links:** `finanzas/page.tsx` L331 ("Nuevo Ingreso"), L337 ("Nuevo Egreso"), L344 ("Transferencia"), L353 ("Emitir Cuotas").

**Componentes reutilizables que ya existen:**
- `finanzas/movimientos/_components/movimiento-form.tsx` — form completo para ingreso/egreso/transferencia
- `finanzas/movimientos/_components/nuevo-movimiento-dialog.tsx` — wrapper dialog del form
- `finanzas/cuotas/_components/cuotas-client.tsx` — tab "emisiones" con logica completa

**Fix propuesto:**
1. `finanzas/movimientos/nuevo/page.tsx` — server component que lee `?tipo` y renderiza `MovimientoForm` con tipo pre-seleccionado
2. `finanzas/transferencias/nueva/page.tsx` — server component que renderiza `MovimientoForm` con `tipo="transferencia"`
3. `finanzas/cuotas/emitir/page.tsx` — extraer/reusar la UI de emision de `cuotas-client.tsx`

**Alternativa minima:** Cambiar los 4 links en `finanzas/page.tsx` para que abran el dialog existente (`nuevo-movimiento-dialog.tsx`) en vez de navegar a pagina inexistente. Menos trabajo, UX de modal en vez de pagina completa.

### Item 2 — Conciliacion

**Veredicto: NO es bug.** El modulo esta completo:
- `conciliacion/page.tsx` — server component con fetch de cajas bancarias
- `conciliacion/_components/conciliacion-client.tsx` — 696 LOC, UI completa con 3 tabs + 4 modales
- `modules/finanzas/lib/conciliacion.ts` — 691 LOC, 10 server actions (import, auto-match, manual, discrepancia, etc.)
- `modules/finanzas/lib/conciliacion-logic.ts` — logica pura extraida para tests
- `tests/unit/finanzas/auto-match.test.ts` — 137 LOC de tests

Si Yair lo ve vacio: probablemente no hay cajas de tipo banco/digital configuradas, o no se importo extracto bancario.

### Item 3 — Libro mayor

**UI completa y conectada:**
- `libro-mayor-client.tsx` tiene 2 queries a `v_libro_mayor` (saldo inicial + movimientos del periodo)
- Boton "Buscar" → `buscar()` que ejecuta las queries
- Botones "PDF" y "Excel" → `exportarReportePDF()` / `exportarReporteXLSX()` de `modules/finanzas/lib/export-reportes.ts`
- Switch "Mostrar anulados" → state toggle que filtra query

**Posible causa de "botones no hacen nada":**
- La vista `v_libro_mayor` puede no tener RLS habilitado para el browser client (anon key)
- O no hay datos (movimientos con cuentas contables asignadas)
- O error silenciado (el componente maneja errores con toast pero si la query retorna vacio, no muestra nada)

**Accion:** Verificar via Supabase MCP que la vista existe y tiene security_invoker o RLS correcto.

### Item 4 — Modal nueva cuenta (Select roto)

**Bug confirmado.** En `cuenta-form-dialog.tsx`:

```tsx
import { Select } from '@/components/ui/select'
// Select = SelectPrimitive.Root (Base UI headless)

// Usado incorrectamente con <option> nativas:
<Select name="tipo" defaultValue={defaultTipo}>
  <option value="">Seleccionar...</option>
  ...
</Select>
```

`SelectPrimitive.Root` no acepta `<option>` children, no renderiza trigger visible, no propaga `name` a FormData. **3 Selects afectados** en el mismo dialog: tipo, cuenta padre, moneda.

**Fix:** Reescribir los 3 Select con la composicion correcta:
```tsx
<Select name="tipo" defaultValue={defaultTipo}>
  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
  <SelectContent>
    <SelectItem value="activo">Activo</SelectItem>
    ...
  </SelectContent>
</Select>
```

**Nota adicional:** Agregar `max-h-[85dvh] overflow-y-auto` al `DialogContent` en `dialog.tsx` L56 para prevenir que dialogs largos se clipeen contra el viewport.

### Item 5A — Periodo: Select mes

**Mismo patron roto que Item 4.** En `nuevo-periodo-dialog.tsx` L63-67:
```tsx
<Select name="mes" defaultValue={String(defaultMes)}>
  {MESES.map((label, i) => (
    <option key={i + 1} value={String(i + 1)}>{label}</option>
  ))}
</Select>
```

El mes nunca se envia en FormData → el server action recibe `null` → periodo se crea con mes incorrecto o falla.

**Fix:** Misma solucion que Item 4 — reescribir con composicion correcta + estado local + hidden input.

### Item 5B — Periodo: cerrar sin refresh

**Toast existe** en `periodo-actions.tsx` L43-44:
```tsx
if (res.success) toast.success('Periodo cerrado')
else toast.error(res.error)
```

**Pero la tabla no refresca** porque en `actions.ts` L708:
```tsx
revalidatePath('/admin/finanzas')
```
No matchea la ruta dinamica `/admin/[tenant]/finanzas/periodos`.

**Fix:** Cambiar a `revalidatePath('/admin/[tenant]/finanzas/periodos', 'page')` en las 3 actions: `cerrarPeriodo`, `abrirPeriodo`, `reabrirPeriodo`.

### Item 6 — Disciplinas

**No existe ninguna pagina disciplinas.** El sidebar tiene items `disc-futbol`, `disc-basquet`, etc. apuntando a `/admin/disciplinas` (ruta inexistente). El catalogo de disciplinas vive en `/admin/catalogos/disciplinas` (ruta generica de catalogos).

`modules/disciplinas/module.json` declara `ui_routes: ["/admin/personas/[id] (tab disciplinas)"]` — la intencion original era tab dentro de persona, no pagina standalone.

**Opciones:**
- **A (redirect):** Crear `disciplinas/page.tsx` que haga redirect a `/admin/catalogos/disciplinas`
- **B (quitar links):** Los items del sidebar estan marcados `estado: 'proximamente'` — si no se renderizan no hay link roto. Verificar si se filtran correctamente
- **C (placeholder):** Crear pagina placeholder con "Proximamente" y link a catalogos

**Recomendacion:** Opcion B si los items `proximamente` ya se ocultan. Si no, Opcion A (1 archivo, 3 lineas).
