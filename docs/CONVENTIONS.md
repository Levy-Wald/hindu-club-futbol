# CONVENTIONS.md — Convenciones operativas del proyecto

**Última actualización:** 27-may-2026

---

## 1. Tag canónico

El tag canónico del repo es siempre el resultado de:

```bash
git describe --tags --abbrev=0 HEAD
```

Este es el valor que debe reflejarse en `CLAUDE.md > Estado actual > Tag actual`.

**No** usar `git log` ni inferir el tag desde el nombre de branch.

---

## 2. Versionado de documentos en Drive

Cuando se actualiza un documento vivo en Drive:

1. Crear el archivo nuevo con el nombre actualizado (ej. `CURRENT-STATE-v3.3-27-MAY-2026.md`)
2. Mover la versión anterior a `_Archivo/`
3. No borrar versiones anteriores — siempre archivar

---

## 3. Archivos sueltos en repo root

Los archivos `.md` temporales (handoffs, borradores, fichas técnicas) **no deben quedarse en la raíz del repo**. Si aparecen:

1. Moverlos a `/Users/yamirolw/_handoffs_temp/` (directorio local, fuera del repo)
2. `.gitignore` tiene patrones para prevenir commits accidentales

---

## 4. Commits y mensajes

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- Scope entre paréntesis: `feat(eventos):`, `docs(adr):`
- Co-authored-by de IA siempre al final del mensaje

---

## 5. Branch naming

- `feature/<sprint-id>-<descripcion-corta>` para sprints
- `fix/<descripcion>` para hotfixes
- Nunca pushear directo a `main` — **override pre-F4:** mientras nadie use producción (pre-F4) se
  commitea directo a `main` con `typecheck`+`build` verdes, sin ramas ni PRs (memoria
  `flujo-commit-directo-main`; el harness opera así, ver `.claude/agents/orchestrator.md`). Este
  punto vuelve a regir en F4.

---

## 6. Protocolo de cierre de sesión (OBLIGATORIO)

Al cerrar **cualquier** sesión de trabajo, la IA ejecutora debe dejar todo documentado, ordenado y canonizado en las **tres superficies del tridente**, de modo que cualquier humano o IA sepa qué se hizo, cómo, y pueda seguir sin contexto previo. Cada superficie guarda **su** faceta (no se duplica — "un dato, un lugar"):

1. **Drive (conocimiento estable)** → doc de **cierre de sesión** en `Z*_Cierres-de-Sesión` de la unidad, con **frontmatter YAML** canónico (`doc:`, `fecha:`, `entity:`, `rag_namespace:`, `naturaleza:`). Contiene: qué se hizo, decisiones tomadas, hallazgos, y pendientes. Es el registro narrativo estable.

2. **Zoho (estado vivo)** → los **pendientes como tareas**, repartidas en el/los BPE que tocan, cada una con la coordenada **`[[clb-key: BPEnn.Snn.Fnn]]`** en la descripción y **asignadas a Yair** por defecto. El estado vivo NO va en Drive.

3. **Repo (código + técnico)** → handoff técnico para la próxima sesión de desarrollo (en `docs/handoffs/` o `docs/cierres/`) y, si cambió el estado del producto, actualizar `docs/CURRENT-STATE.md` + el tag/estado en `CLAUDE.md`. Nunca duplicar en el repo lo que es estado vivo de Zoho o conocimiento estable de Drive.

4. **Chat (continuidad)** → dejar **siempre**, como último mensaje, un **prompt de continuación** para la próxima sesión de Claude Code, con todo el contexto (qué se hizo, dónde quedó, qué sigue, IDs/coordenadas relevantes), para arrancar directo donde se dejó.

Regla DONE (ADR-064): DONE técnico ≠ terminado. Solo el DONE visual de Yair marca `terminado`.
