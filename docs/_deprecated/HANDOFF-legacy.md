> SUPERSEDED — Reemplazado por el sistema OPENING + CURRENT-STATE + handoffs/ (ver ADR-064 y docs/OPENING.md). Conservado solo como referencia histórica.

# HANDOFF.md — Checklist de continuidad entre sesiones IA

**Última actualización:** 27-may-2026

---

## Propósito

Este documento define qué debe verificar una sesión IA nueva antes de empezar a trabajar, para evitar drift y decisiones duplicadas.

---

## Checklist de arranque

1. **Leer `CLAUDE.md`** — contexto operativo completo
2. **Verificar tag actual** — `git describe --tags --abbrev=0 HEAD` debe coincidir con lo que dice CLAUDE.md
3. **Leer `docs/CURRENT-STATE.md`** — estado concreto del proyecto
4. **Verificar branch** — `git branch --show-current` debe ser el branch correcto para el sprint
5. **Verificar git status limpio** — `git status --short` debe estar vacío (salvo archivos en `.gitignore`)
6. **Leer prompt del sprint** — Yair lo pega manualmente al inicio de sesión

---

## Estado al cierre 27-may-2026

| Item | Valor |
|---|---|
| Tag HEAD | `v0.35.3-loading-selectivo` |
| Branch | `main` |
| Git status | Limpio (3 archivos sueltos en .gitignore) |
| Sprints cerrados hoy | A4.5 (paridad eventos planificadores), D (loading selectivo) |
| Próximo sprint | F3 Portal Cliente |
| Vercel | READY (deploy automático en push a main) |

---

## Deuda técnica conocida (no bloquea F3)

- `modules/planificadores/ui/crear-evento-dialog.tsx` — dead code, ya no se importa (reemplazado por `modules/eventos/ui/crear-evento-dialog.tsx`)
- Links rotos "Ver detalle completo" en modals de evento (ruta `/admin/{tenant}/operaciones/eventos/{id}` no existe aún)
- ~210 server actions pendientes de migrar al middleware de capabilities (ADR-055/062)

---

## Archivos sueltos movidos (housekeeping local)

Los siguientes archivos se movieron fuera del repo a `~/_handoffs_temp/`:

- `B4.1_Ficha_Tecnica_v1.1_actualizada.md`
- `C4_Estado_BPs_v1.1_actualizado.md`
- `C4_SMV_Cambios_aplicados_2026-05-27.md`
