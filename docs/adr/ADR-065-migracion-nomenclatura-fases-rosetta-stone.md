# ADR-065 — Migración a nomenclatura única F0–F10 (Rosetta Stone)

**Estado**: Accepted
**Fecha**: 28-may-2026
**Fuente de verdad**: Drive `_Arquitectura/ADR-065-migracion-nomenclatura-fases-rosetta-stone`

## Contexto

El roadmap usaba múltiples nomenclaturas acumuladas: FASE A–E, C0, Fase 6, Fase 9, Fase 16, pre-launch. Esto generaba ambigüedad y confusión, especialmente al onboardear nuevos participantes.

## Decisión

Se adopta una nomenclatura única de 11 fases: **F0–F10**.

| Código | Nombre |
|---|---|
| F0 | Base / Infra |
| F1 | Troncal núcleo ERP+CRM |
| F2 | Vertical CCBP |
| F3 | Portal Cliente |
| F4 | Validación Hindu |
| F5 | Switch a producción |
| F6 | Premium ERP |
| F7 | Premium Socio |
| F8 | Verticales nuevas |
| F9 | IA y Plataforma SaaS |
| F10 | Backlog futuro |

- Los docs live se migran al vocabulario nuevo.
- Los docs históricos (cierres, RFCs, ADRs viejos, sprints pasados, auditorías) **no se tocan** — se entienden vía la Rosetta Stone en `docs/PHASES.md`.
- Commits, tags git y nombres de archivos SQL son historia inmutable y no se migran.

## Consecuencias

- Todo nuevo documento y conversación usa F0–F10.
- La Rosetta Stone en `docs/PHASES.md` traduce vocabulario viejo a nuevo.
- Se elimina la ambigüedad "C0 vs Fase 6 vs pre-launch" (todo es F3).

## Referencias

- `docs/PHASES.md` — fuente de verdad completa con Rosetta Stone
