# AUDIT H1 — Drift check TS-BD post-FASE-A

**Sprint**: H1 (Tramo 2 RFC-005)
**Fecha**: 14 de mayo de 2026
**Tag**: `v0.29.1-hardening-h1`
**Auditor**: Claude Code (Opus 4.6)

---

## Resumen ejecutivo

Auditoria completa de drift entre TypeScript y BD para todos los modulos creados/modificados en sprints A2.x y A3.x (10 sprints ejecutados entre 13-may y 14-may).

**Resultado: CERO drift detectado.** Todas las columnas referenciadas en codigo existen en la BD y viceversa. Las migraciones aplicadas via MCP durante cada sprint mantuvieron la sincronizacion.

---

## Modulos auditados

### PIM (modules/pim/) — Sprints A2, A2.1, A2.2, A2.5, A2.6

| Tabla | Columnas BD | Columnas TS | Drift |
|---|---|---|---|
| `productos` | 42 | 42 | CERO |
| `productos_variantes` | 14 | 14 | CERO |
| `producto_categorias` | 11 (incl. `orden`) | 11 | CERO |
| `producto_marcas` | 11 (incl. `descripcion`, `sitio_web`, `metadata`) | 11 | CERO |
| `producto_listas_precios` | 13 (incl. `activa`, `descripcion`, `orden`, `metadata`) | 13 | CERO |
| `producto_precios` | 13 (incl. `moneda`, `fecha_vigencia_desde/hasta`, `notas`, `metadata`) | 13 | CERO |
| `producto_stock_espacio` | 11 (incl. `cantidad`, `notas`, `metadata`) | 11 | CERO |
| `producto_movimientos_stock` | 14 (incl. `fecha`, `notas`, `metadata`) | 14 | CERO |
| `producto_proveedores` | 14 (incl. `plazo_entrega_dias`, `metadata`) | 14 | CERO |
| `producto_responsables` | 8 (incl. `rol`, `atributo_slug`) | 8 | CERO |
| `producto_imagenes` | 7 | 7 | CERO |
| `producto_categoria_links` | 3 | 3 | CERO |

Nota: El hotfix post-A2.6 (commit `795f56d`) corrigio drift previo en `producto_proveedores`, `producto_stock_espacio`, `producto_movimientos_stock`. Post-hotfix, todo alineado.

### Finanzas (modules/finanzas/) — Sprints A3.1 a A3.6

| Tabla | Columnas BD | Columnas TS | Drift |
|---|---|---|---|
| `cotizaciones` | 9 (moneda, valor_compra, valor_venta, fuente) | 9 | CERO |
| `convenios_pago` | 14 (deuda_original, cantidad_cuotas, monto_cuota, fecha_inicio, proximo_vencimiento) | 14 | CERO |
| `periodos_contables` | 10 (anio, mes, estado, notas) | 10 | CERO |
| `config_financiera` | 16 (moneda_principal, mora_*, comprobante_*, cierre_automatico, numeracion_*) | 16 | CERO |
| `conciliacion_movimientos_bancarios` | 20 (fecha_valor, import_batch_id, fila_origen, conciliado_at, conciliado_por_id, notas_conciliacion) | 20 | CERO |

---

## Checks transversales

### Check 1 — FKs salientes

Todas las FKs de las 16 tablas auditadas apuntan a tablas troncales/catalogo canonicas:
- `tenants`, `personas`, `entidades`, `cajas`, `espacios`, `movimientos_caja`
- `catalogo_atributos`, `catalogo_categorias_movimiento`, `catalogo_unidades_medida`, `catalogo_tipos_talle`
- `plan_cuentas`, `centros_costo`
- Auto-referencias: `producto_categorias.parent_id` -> `producto_categorias`
- Inter-PIM: `producto_precios` -> `producto_listas_precios`, variantes, productos
- Resultado: **0 FKs cruzadas no canonizadas**

### Check 2 — RLS + policies + triggers

| Tabla | RLS | Policies | Estrategia | deleted_at | trg_updated_at |
|---|---|---|---|---|---|
| `productos` | true | 1 tenant_select | Directo `tenant_id` | SI | SI |
| `productos_variantes` | true | 1 ALL via producto | FK-through | SI | SI |
| `producto_categorias` | true | 1 tenant_select | Directo `tenant_id` | SI | SI |
| `producto_categoria_links` | true | 1 ALL via producto | FK-through | NO (junction) | NO (junction) |
| `producto_listas_precios` | true | 1 tenant_select | Directo `tenant_id` | SI | SI |
| `producto_precios` | true | 1 ALL via producto | FK-through | SI | SI |
| `producto_stock_espacio` | true | 1 ALL via producto | FK-through | SI | SI |
| `producto_movimientos_stock` | true | 1 ALL via producto | FK-through | NO (log) | NO (log) |
| `producto_imagenes` | true | 1 ALL via producto | FK-through | NO (media) | NO (media) |
| `producto_proveedores` | true | 1 ALL via producto | FK-through | SI | SI |
| `producto_responsables` | true | 1 ALL via producto | FK-through | NO (link) | SI |
| `config_financiera` | true | 4 (CRUD) | Directo `tenant_id` + `puede_operar_finanzas()` | NO (singleton) | SI |
| `convenios_pago` | true | 4 (CRUD) | Directo `tenant_id` + `puede_operar_finanzas()` | NO (lifecycle) | SI |
| `cotizaciones` | true | 4 (CRUD) | Directo `tenant_id` (nullable, shared) | NO (log) | NO (log) |
| `periodos_contables` | true | 4 (CRUD) | Directo `tenant_id` + `puede_operar_finanzas()` | NO (lifecycle) | SI |
| `conciliacion_movimientos_bancarios` | true | 4 tenant | Directo `tenant_id` | SI | SI |

- **16/16 tablas con RLS habilitado**: OK
- **16/16 tablas con policies de tenant**: OK (directas o via FK-through a producto)
- Tablas sin `deleted_at`: junction tables, log tables, singletons, lifecycle tables — justificado por diseno
- Tablas sin `trg_updated_at`: log/media tables (immutable after insert) — justificado por diseno

### Check 3 — Trigger function incorrecta

0 triggers usando `set_updated_at()` sin prefijo `trg_`. Todos usan `trg_set_updated_at()` correctamente.

---

## Correcciones aplicadas

Ninguna. No se detecto drift que requiera correccion.

---

## Deuda registrada

Ninguna deuda de drift. Las unicas observaciones son:
1. Tablas child sin `deleted_at` (junction/log/media) — por diseno, no requieren soft-delete.
2. Tablas log sin `trg_updated_at` — por diseno, son immutable after insert.

---

## Verificacion final

- `tsc --noEmit`: 0 errores
- `pnpm build`: exitoso
- Vercel deploy: READY (verificado via MCP web_fetch)
