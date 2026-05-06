# Proximo Sprint: 9 — Cajas + Movimientos + Productos

## Para el humano o agente que va a trabajar

Lee estos archivos antes de empezar:
1. `CLAUDE.md` — reglas del proyecto, stack, convenciones
2. `MASTER-GAPS.md` — roadmap completo de 15 sprints, estado actual
3. `docs/WORKFLOW.md` — checklist pre/post desarrollo
4. Este archivo — que hacer ahora

---

## Contexto rapido

**Estado actual:** Sprints 1-8 completos + UX transversal.
**Proximo:** Sprint 9.

---

## Que hay que hacer en Sprint 9

### Objetivo
Sistema financiero básico: cajas del club, movimientos de dinero, catálogo de productos/servicios, y cuotas.

### Entregables

#### 1. ABM Cajas
- Crear/editar cajas (operativa, shop, eventos, sede)
- Cada caja tiene saldo, tipo, responsable
- Vista listado + detalle

#### 2. Categorías de movimiento
- ABM categorias_movimiento (ingreso, egreso, transferencia)
- Categorías predefinidas (cuota, venta, compra, salario, etc.)

#### 3. Productos y servicios
- ABM productos_servicios (catálogo unificado)
- Campos: nombre, tipo, precio, moneda, categoría, activo
- Sirve para: cuotas, productos del shop, servicios

#### 4. Movimientos de caja
- CRUD movimientos_caja
- Tipos: ingreso, egreso, transferencia entre cajas
- Vinculado a persona, producto, categoría
- Comprobante (upload a storage)

#### 5. Cuotas y planes
- ABM cuotas_planes (mensual, anual, trimestral)
- Emisión masiva de cuotas por padrón
- Estado: pendiente, pagada, vencida, anulada

#### 6. Vista "Mi cuenta"
- Saldo por persona
- Historial de movimientos
- Cuotas pendientes

### Archivos relevantes
- `app/admin/cajas/` — actualmente placeholder
- `lib/supabase/server.ts` — client

---

## Reglas importantes

1. **Verificar schema** antes de crear migrations
2. **shadcn v4 usa `render` prop**, NO `asChild`
3. **TENANT_ID hardcodeado** = `'11111111-1111-1111-1111-111111111111'`
4. **Verificar build**: `pnpm build`
5. **PENDIENTE_VALIDACION_VISUAL** si no probaste visualmente
6. **Actualizar MASTER-GAPS.md** al terminar

---

## Vision global

```
Sprints 1-8:  ████████████████████████████████████████ HECHO
Sprint 9:     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ <- ESTAS ACA (cajas, movimientos, productos)
Sprints 10-11:░░░░░░░░░░░░░░░░░░ (operaciones, empleados)
Sprints 12-14:░░░░░░░░░░░░░░░░░░ (comunicaciones, API/MCP, conectores)
Sprint 15:    ░░░░░░░░░░░░░░░░░░ (hardening -> HINDU LIVE)
```
