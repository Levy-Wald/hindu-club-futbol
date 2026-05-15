# ADR-049 — Tag obligatorio antes de pasar al siguiente sprint

**Status**: Accepted
**Fecha**: 2026-05-14

## Contexto

Sin tag intermedio, rollback a "estado limpio post-sprint-N" es costoso.

## Decision

Ningun sprint nuevo arranca sin que el anterior este commiteado, pusheado Y tagueado.

## Procedimiento

Si Yair se olvida y pasa al siguiente sin tag, Claude Opus pausa el flow y manda comando exacto para tagear retroactivamente.

## Consecuencias

- Rollback siempre posible a cualquier sprint cerrado
- Historial de tags es el registro canonico de progreso
