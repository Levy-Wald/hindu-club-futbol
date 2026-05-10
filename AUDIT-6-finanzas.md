# PARTE 6 — Finanzas (estado actual)

## Resumen

El módulo de finanzas tiene **tablas completas, UI completa, pero datos vacíos o de prueba en DB**.
Es el módulo más grande del proyecto en términos de tablas (17) y UI (6 rutas).

## 6.1 Tablas existentes

| Tabla | Columnas clave | Estado |
|-------|---------------|--------|
| `cajas` | id, nombre, tipo, moneda, saldo_actual, activo | Creada, UI funcional |
| `movimientos_caja` | id, caja_id, tipo, monto, fecha, categoria_id, persona_id, entidad_id, comprobante | Creada, UI funcional |
| `plan_cuentas` | id, codigo, nombre, tipo, padre_id, nivel | Creada, seedeada (~50+ cuentas), UI funcional |
| `productos_servicios` | 36 columnas, 13 tipos (cuota, alquiler, servicio, producto...) | Creada, UI funcional con ERP completo |
| `cuotas_planes` | id, nombre, monto, periodicidad, tipo_producto_id | Creada, UI funcional |
| `cuotas_emitidas` | id, plan_id, mes, anio, monto | Creada, UI funcional |
| `cuotas_generadas` | id, emision_id, persona_id, estado, fecha_vencimiento | Creada, UI funcional |
| `cuotas_bonificaciones` | id, tipo, porcentaje, motivo | Creada |
| `emisiones_cuota` | id, plan_id, fecha_emision, total_generadas | Creada |
| `cuentas_corrientes` | id, persona_id, saldo | Creada |
| `centros_costo` | id, nombre, codigo | Creada |
| `medios_pago` | id, nombre, tipo | Creada, seedeada |
| `tipos_comprobante` | id, nombre, codigo | Creada |
| `periodos_contables` | id, nombre, fecha_inicio, fecha_fin | Creada |
| `config_financiera` | id, tenant_id, moneda_default, etc. | Creada |
| `convenios_pago` | id, persona_id, plan, cuotas | Creada |
| `cotizaciones` | id, moneda_origen, tasa | Creada |

**VIEWs backward-compat:** 10 VIEWs `fin_*` creadas en Sprint 11.7 con SECURITY INVOKER.

## 6.2 Server actions de finanzas

| Archivo | Funciones | Estado |
|---------|-----------|--------|
| `app/admin/finanzas/_actions.ts` | crearCaja, editarCaja, toggleCaja | Implementado |
| `app/admin/finanzas/movimientos/_actions.ts` | crearMovimiento, anularMovimiento | Implementado |
| `app/admin/finanzas/productos/_actions.ts` | crearProducto, editarProducto, toggleProducto | Implementado |
| `app/admin/finanzas/productos/importar/_actions.ts` | importarProductos (4 pasos) | Implementado |
| `app/admin/finanzas/cuotas/_actions.ts` | crearPlan, emitirCuotas, registrarPago | Implementado |

## 6.3 UI de finanzas

| Ruta | Pantalla | Estado |
|------|----------|--------|
| `/admin/finanzas` | Dashboard con stats (cajas, movimientos del mes, productos) | Funcional |
| `/admin/finanzas/cajas` | Lista cajas + crear/editar | Funcional |
| `/admin/finanzas/cajas/[id]` | Detalle caja con movimientos | Funcional |
| `/admin/finanzas/movimientos` | Lista movimientos con filtros avanzados | Funcional |
| `/admin/finanzas/productos` | Productos ERP (30+ campos, 13 tipos) con import/export | Funcional |
| `/admin/finanzas/productos/importar` | Import masivo productos (wizard 4 pasos) | Funcional |
| `/admin/finanzas/cuotas` | 3 tabs: Planes, Emisiones, Estado de cuotas | Funcional |
| `/admin/finanzas/plan-cuentas` | Plan de cuentas jerárquico con edición inline | Funcional |
| `/admin/mi-cuenta` | Cuenta corriente personal del usuario logueado | Funcional |

**La UI está completa y funcional.** El gap es que los datos operativos en DB son de prueba o vacíos.

## 6.4 Lo que NO existe (gaps obvios)

### Gaps de modelo/lógica:
1. **Suscripciones persona↔plan:** No hay tabla que vincule "esta persona está suscripta a este plan de cuota". Las cuotas se emiten masivamente pero falta el concepto de "suscripción activa".
2. **Generación automática de cuotas:** Las cuotas se emiten manualmente. No hay scheduler que genere cuotas periódicas automáticamente.
3. **Cobranza/conciliación:** No hay conciliación bancaria, ni matching de pagos recibidos con cuotas pendientes.
4. **Recibos/comprobantes:** No se generan PDFs de recibos automáticamente.
5. **Responsable de pago:** Para menores, el padre/tutor debería poder pagar (spec en docs/MENORES-TUTORES.md, no implementado).
6. **Integración MercadoPago:** Declarada en roadmap, no implementada.

### Gaps de UI/UX:
7. **Dashboard financiero:** Tiene stats básicos pero no tiene gráficos de tendencia ni reportes.
8. **Reportes contables:** No hay balance, ni estado de resultados, ni libro diario.
9. **Estado de morosidad:** No hay vista consolidada de morosos.

### Gaps operativos:
10. **Datos reales:** Las tablas financieras están vacías o con datos de prueba en el tenant Hindu. Nunca se cargaron datos operativos reales.
11. **El código usa nombres viejos:** Las queries todavía usan `cajas`, `movimientos_caja`, etc. en vez de las VIEWs `fin_cajas`, `fin_movimientos`. El refactor está diferido a Sprint 16.
