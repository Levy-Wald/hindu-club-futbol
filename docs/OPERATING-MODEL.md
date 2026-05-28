# OPERATING MODEL — Killer Machine

> **Vigente desde**: 28-may-2026
> **Canonizado en**: ADR-064 (Drive `_Arquitectura/ADR-064-killer-machine-operating-model`)

Este documento define **cómo opera el proyecto SaaS Empresarial** en términos de información, roles y reglas. Cualquier humano o IA que se sume al sistema debe leer esto primero.

---

## 1. Killer Machine — el cuarteto de superficies

| Superficie | Rol | Qué vive aquí |
|---|---|---|
| **Zoho Projects** | Fuente de verdad de **tareas** | Tareas, estados, sprints, dependencias, subtareas, problemas. Lo que se está construyendo y validando. Proyecto único: **LE-8 SaaS Empresarial** (portal serviciosclevel, portal_id 918690668, project_id 2651844000000411004) |
| **Google Drive** | Fuente de verdad de **documentación larga** | ADRs, RFCs, manuales, especificaciones, decisiones, cierres, matrices visuales, boot prompts, handoffs |
| **Repo GitHub** (`github.com/Levy-Wald/hindu-club-futbol`) | Fuente de verdad de **código + docs técnicos** | `CLAUDE.md`, `docs/*.md`, `docs/adr/*` (espejos de Drive), migraciones, código, tests |
| **Raíz compu** (`/Users/yamirolw/hindu-v2`) | Copia local del repo | Donde Code trabaja. Se sincroniza con repo vía git. No es fuente de verdad propia |

---

## 2. El tridente operativo

| Rol | Responsabilidades | Dónde escribe |
|---|---|---|
| **Yair Levy Wald** | Decisión arquitectural y comercial. QA humano (validar lo construido antes de marcarlo terminado). Aprobación de cambios mayores. Smoke testing en producción. Borrado de archivos en Drive | Todas las superficies (UI) |
| **Claude Opus** | Especificación. ADRs, RFCs. Prompts para Code. Análisis de impacto. Decisiones de modelo. Verificación MCP. Redacción de docs | Drive (vía MCP), Zoho (vía MCP). NO escribe en repo |
| **Claude Code** | Implementación. Migraciones SQL. Código. Edits a docs técnicos del repo. Commits y push | Repo (único que puede). NO escribe en Drive ni Zoho |

---

## 3. Reglas de quién toca qué

- **Solo Code escribe en el repo y en la raíz compu.** Si Opus necesita un cambio en el repo, redacta un prompt para Code.
- **Opus escribe en Drive y Zoho** vía MCP.
- **Yair** valida y aprueba en cualquiera; **es el único** que puede borrar archivos en Drive y aprobar tags git.
- **Migraciones manuales de Yair**: borrar archivos viejos en Drive, confirmar tags, autorizar cambios mayores.

---

## 4. Reglas de sincronización entre superficies

- **Repo → Raíz compu**: `git pull` después de cada push de Code.
- **Drive → Repo**: cada ADR creado en Drive debe tener su espejo en `docs/adr/ADR-NNN-*.md`. Se carga vía prompt a Code.
- **Repo → Drive**: cuando ROADMAP, MODULE-CATALOG, PHASES, OPERATING-MODEL cambian en el repo, Opus replica los cambios en Drive vía MCP.
- **Zoho ↔ resto**: Zoho es de tareas, nunca duplica docs largos. Cada tarea importante linkea al ADR o spec en Drive.

---

## 5. Regla DONE — DONE técnico vs DONE visual

- **DONE técnico** = build, tests, smoke automático OK. No hubo validación humana.
- **DONE visual / QA humano** = Yair confirmó manualmente en producción.

Reglas:
- Ninguna tarea pasa a `terminado` en Zoho sin DONE visual.
- Ningún sprint cierra ni se taguea sin DONE visual.
- Code marca `DONE técnico` y notifica a Yair para validación.
- Si Yair pasa al siguiente sprint sin haber dado DONE visual, Opus pausa y pide cerrar formalmente.

---

## 6. Vocabulario controlado de estados

`no analizado` · `analizado` · `analizado y prompteado` · `diseño sin código` · `en desarrollo` · `en qa` · `QA humano` · `revisar` · `terminado` · `eliminado` · `suspendido momentáneamente`

**Flujo correcto**: `en desarrollo → en qa (técnico) → QA humano (Yair revisa) → terminado (Yair aprueba)`

Ver `docs/PHASES.md` para significados completos.

---

## 7. Nomenclatura de fases (resumen)

F0–F10. Sintaxis: `Fx.y — Nombre del módulo`. Sub-tareas: `Fx.y.z — Nombre`.

Detalle completo en `docs/PHASES.md`.

---

## 8. Onboarding de un nuevo miembro (humano o IA)

Quien se sume al sistema lee, en este orden:

1. **ADR-064** (Drive `_Arquitectura/ADR-064-killer-machine-operating-model`) o este `OPERATING-MODEL.md` — entiende cómo se opera.
2. **ADR-065** (Drive `_Arquitectura/ADR-065-migracion-nomenclatura-fases-rosetta-stone`) — entiende por qué los docs viejos usan otro vocabulario.
3. **`docs/PHASES.md`** — conoce la nomenclatura F0–F10.
4. **`docs/MODULE-CATALOG.md`** — conoce los módulos del producto.
5. **Zoho Projects → LE-8 SaaS Empresarial** — ve el estado actual de trabajo.
6. **`docs/HANDOFF.md`** — ve dónde quedó la sesión anterior si está retomando.

Recién después de eso, opera dentro de las reglas. No escribe en superficies que no le corresponden. Respeta DONE técnico vs visual.

---

## 9. Estado vivo del proyecto

El estado vivo siempre se ve en Zoho. El sheet `Matriz-Modulos-SMV-ClubCore-v7.xlsx` en Drive raíz es la **vista inicial congelada** de auditoría: refleja cómo estaban las cosas el 28-may-2026. Se actualiza solo si cambia la estructura (tipos, alcance, módulos nuevos), no estados de tareas.

---

## 10. Lo que NO se hace (anti-patrones)

- Mantener el mismo estado en dos lugares (rompe el modelo de fuente de verdad única).
- Tocar docs históricos para "modernizar el vocabulario" (son snapshots de su época; ver Rosetta Stone en `PHASES.md`).
- Marcar tareas como `terminado` sin DONE visual de Yair.
- Saltar el orden de superficies cuando se opera: si la decisión está en chat conmigo, mi obligación es canonizarla en Drive (ADR) y reflejarla en Zoho (tarea). No queda solo en el chat.
- Improvisar nombres de fase fuera del rango F0–F10.

---

## Referencias

- ADR-064 — Killer Machine: Operating Model (decisión formal en Drive)
- ADR-065 — Migración nomenclatura fases (decisión formal en Drive)
- `docs/PHASES.md` — fuente de verdad de fases
- `docs/MODULE-CATALOG.md` — catálogo de módulos
- `docs/HANDOFF.md` — handoff entre sesiones
- Drive raíz → `Matriz-Modulos-SMV-ClubCore-v7.xlsx`
- Drive raíz → `Matriz-Modulos-SMV-ClubCore-ZOHO.xlsx`
- Zoho Projects → proyecto LE-8 SaaS Empresarial
