# ADR-051 — Resolucion contextual de cuentas contables via tipo_uso del producto

**Status**: Accepted
**Fecha**: 2026-05-14

## Contexto

Al crear un movimiento financiero, las cuentas contables (ingreso/egreso/IVA) deberian resolverse automaticamente sin obligar configuracion manual.

## Decision

El producto involucrado en el movimiento tiene un `tipo_uso` (reventa, uso_interno_consumible, uso_interno_bien_uso, servicio). El sistema usa un helper que mapea tipo_uso + tipo_movimiento a cuentas contables.

Helper: `resolverCuentasMovimiento(producto_id, tipo_movimiento)` retorna `{ cuenta_ingreso, cuenta_egreso, cuenta_iva_db, cuenta_iva_cr }`.

## Consecuencias

- Menos error humano al crear movimientos
- Contabilidad consistente
- Requiere mantener el mapeo si cambia el plan de cuentas
