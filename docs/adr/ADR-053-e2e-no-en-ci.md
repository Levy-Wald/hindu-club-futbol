# ADR-053 — E2E tests excluidos de CI

**Fecha:** 2026-05-18
**Estado:** Aceptado
**Sprint:** H6

## Contexto

Los tests E2E de Playwright corren contra la base de datos de produccion
(Supabase `hkoizqbptwhnepzbmjql`) usando `serviceRole()`. Incluirlos en
GitHub Actions CI requeriria:

1. Exponer `SUPABASE_SERVICE_ROLE_KEY` como secret de GitHub
2. Que CI tenga acceso de red a Supabase (no hay IP allowlist, pero es
   un secret critico)
3. Que los tests de cleanup fallen sin afectar datos reales
4. Tiempos de ejecucion de ~50s que bloquearian merges

## Decision

Los tests E2E se ejecutan **solo localmente** por el desarrollador
(o por el arquitecto via CLI) antes de pushear. NO se incluyen en el
workflow de GitHub Actions CI.

El CI incluye:
- `lint` (ESLint)
- `typecheck` (tsc --noEmit)
- `test:unit` (Vitest)
- `build` (next build)

## Consecuencias

- **Positivo:** No se expone `SUPABASE_SERVICE_ROLE_KEY` en GitHub
- **Positivo:** CI rapido (~2-3 min vs ~5 min con E2E)
- **Negativo:** Regresiones E2E solo se detectan si se corren manualmente
- **Mitigacion:** Correr `pnpm run test:e2e` antes de cada tag/release

## Alternativas evaluadas

1. **GitHub Environment secrets + E2E en CI:** Rechazado por riesgo de
   exponer service role key
2. **Supabase branching para CI:** Rechazado por costo y complejidad
3. **Mock completo de Supabase en CI:** Rechazado por baja fidelidad
