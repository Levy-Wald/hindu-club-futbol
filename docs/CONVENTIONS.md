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
- Nunca pushear directo a `main`
