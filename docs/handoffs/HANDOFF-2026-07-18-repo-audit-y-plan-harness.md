---
doc: HANDOFF-2026-07-18-repo-audit-y-plan-harness
fecha: 2026-07-18
entity: SaaS Empresarial (repo hindu-club-futbol)
naturaleza: handoff técnico + plan de ejecución para la próxima sesión
---

# Handoff — Auditoría de repo + plan para armar el harness (18-jul-2026)

## Contexto
La sesión previa fue reorg de Drive/Zoho de la unidad SaaS para el RAG (ver `Z1_Cierres-de-Sesión/CIERRE-2026-07-17` en Drive). Al cierre, Yair pidió auditar si el repo está listo para **continuar el desarrollo con el harness multi-agente (orquestador / coder / QA) en formato goals+loops por fases/sprints**. Esta es esa auditoría + el plan.

## Estado auditado (evidencia, 18-jul)

### ✅ Sano
- Working tree limpio; `.gitignore` completo (no hay artefactos de build trackeados).
- `docs/` canónico y ordenado (ARCHITECTURE, ROADMAP, PHASES, DATA-MODEL, POSTGRES, SECURITY, DECISIONS + adr/, rfcs/, sprints/, handoffs/, cierres/, audits/, templates/ + archive/ y _deprecated/).
- APIs/conectores documentados: `docs/API.md` + `lib/connectors/{payments,messaging,calendar}` + `email-adapter.ts` (mock-first, ADR-035).

### 🟡 A corregir
- **Roadmap sin formato goals/loops.** Hay ROADMAP.md + PHASES.md + sprints/, pero NO existe `docs/ROADMAP-LOOPS.md` (la cola ejecutable loop/gate/goal que consume el harness, como en Kontrol).
- **Drift de estado.** `CLAUDE.md` dice tag `v0.40.0` / fase F1; `CURRENT-STATE.md` dice tag `v0.51.0` / fase F3. Se contradicen. `CURRENT-STATE` es del 24-jun (desactualizado).
- **`sprint-a1-screenshots/` (7 PNGs) en la raíz** — viejos, trackeados; mover a `docs/_assets/` o `archive/`.

### ❌ Falta (bloquea "continuar con el equipo del bot")
- **Harness NO materializado.** `.claude/` tiene solo `settings.local.json`. No hay `.claude/agents/` (orquestador/coder/QA), ni `.claude/skills/`, ni hooks, ni commands. El equipo de agentes está documentado a nivel concepto (`docs/OPERATING-MODEL.md`, OM-001 en Drive) pero no ejecutable.

## Plan para la próxima sesión (en orden)
1. **Armar el harness `.claude/`** espejando Kontrol (`Levy-Wald/kontrol.ar`):
   - `.claude/agents/`: orquestador, coder, QA (roles, tools, límites; ver ADR-064 y OPERATING-MODEL.md).
   - skills/hooks/commands según lo que use Kontrol.
   - Versionar lo que corresponda (hoy `settings.local.json` no se commitea; `AGENTS.md` está en `.gitignore` — revisar si eso sigue vigente).
2. **Crear `docs/ROADMAP-LOOPS.md`**: desglosar el proyecto en goals → loops por fase/sprint, con gates 🔴 y decisiones 🟡, como cola ejecutable. Alinear con `docs/ROADMAP.md` (narrativa) y `docs/PHASES.md` (F0–F10). Un dato, un lugar: el estado del loop vive en LOOPS, no duplicado.
3. **Reconciliar estado:** actualizar `CLAUDE.md > Estado actual` (tag real vía `git describe --tags --abbrev=0`, fase real) contra `CURRENT-STATE.md`; dejar UNA fuente de verdad del estado y que la otra la referencie (ver CONVENTIONS §1 y §6).
4. **Mover `sprint-a1-screenshots/`** a `docs/_assets/` o `archive/`.

## Coordenadas útiles
- Referencia harness: repo `Levy-Wald/kontrol.ar` (mismo tipo de unidad-producto; tiene harness + `docs/ROADMAP-LOOPS.md`).
- Deploy pre-F4: commit directo a `main` con typecheck+build verdes (ver memoria `flujo-commit-directo-main`).
- Pendientes registrados como tareas Zoho (BPE07 harness; BPE04 loops/reconcile/screenshots), asignadas a Yair.
