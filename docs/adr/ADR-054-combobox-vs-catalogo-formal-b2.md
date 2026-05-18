# ADR-054: Combobox vs catalogo formal para clubes/torneos externos (B2)

**Status**: Accepted
**Date**: 2026-05-18
**Context**: Sprint B7-FIX (ISSUE-008)

## Decision

Mantener `club_nombre` y `torneo_nombre` como campos text libre en `persona_trayectoria_clubes` y `persona_logros`, pero usar componente `<Combobox>` que sugiere valores ya cargados por otros usuarios del mismo tenant antes de permitir texto nuevo.

## Alternatives Considered

- **Option A (adopted)**: Text libre + Combobox con autosuggest de valores existentes
- **Option B (deferred)**: Catalogos formales (`catalogo_clubes_externos`, `catalogo_torneos_externos`) con FK

## Rationale

- Hindu tiene datos heterogeneos de clubes y torneos (nombres no estandarizados)
- Un catalogo formal requiere mantenimiento, deduplicacion, fusion de duplicados
- El Combobox con autosuggest da consistencia "natural" sin overhead
- Si en FASE C Hindu pide mas rigor, migrar a Option B post-demo

## Consequences

- Pueden existir variantes del mismo club ("Boca Juniors", "Boca Jrs")
- El Combobox reduce pero no elimina duplicados
- Deuda: si se detecta necesidad de merge de duplicados, crear sprint futuro post-FASE-C
