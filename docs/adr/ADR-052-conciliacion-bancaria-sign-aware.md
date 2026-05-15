# ADR-052 — Conciliacion bancaria con auto-match sign-aware

**Status**: Accepted
**Fecha**: 2026-05-14

## Contexto

Los extractos bancarios traen montos con signo (+ credito / - debito). Los movimientos del sistema tienen un campo `tipo` (ingreso/egreso) que define la direccion del signo.

## Decision

El auto-match interpreta el signo del extracto y lo cruza con el tipo del movimiento del sistema:
- extracto monto positivo -> busca movimientos tipo ingreso
- extracto monto negativo -> busca movimientos tipo egreso

Con tolerancia numerica configurable (default 0.01).

## Consecuencias

- Match correcto cuando los signos coinciden
- Evita falsos positivos por valor absoluto similar pero direcciones contrarias
- Tolerancia configurable para diferencias de centavos
