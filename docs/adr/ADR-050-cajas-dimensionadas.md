# ADR-050 — Cajas con dimensiones contables-fiscales

**Status**: Accepted
**Fecha**: 2026-05-14

## Contexto

Una caja no es solo "cuenta de dinero" sino que tiene contexto fiscal, organizacional y bancario.

## Decision

La tabla `cajas` incorpora:
- `tipo_fiscal`: blanco | negro | mixto
- `entidad_id`: responsable legal (FK a entidades)
- `actividad_slug`: contexto del negocio (CCBP, concesion, alquiler, etc.)
- datos bancarios: `banco_nombre`, `cbu`, `numero_cuenta`
- `deleted_at`: soft-delete

## Consecuencias

- Reporting fiscal correcto
- Segregacion por actividad
- Soporte para flujos mixtos blanco/negro
