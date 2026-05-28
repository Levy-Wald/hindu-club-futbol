# ADR-064 — Killer Machine: Operating Model del cuarteto

> Espejo de Drive `_Arquitectura/ADR-064-killer-machine-operating-model`. Fuente de verdad allí.

**Estado**: Accepted
**Fecha**: 28-may-2026
**Fuente de verdad**: Drive `_Arquitectura/ADR-064-killer-machine-operating-model`

## Contexto

El proyecto operaba con información dispersa entre chat, Drive, repo y Zoho sin reglas claras de quién escribe dónde ni qué superficie es fuente de verdad para qué tipo de información.

## Decisión

Se establece el **cuarteto de superficies**:

| Superficie | Fuente de verdad de |
|---|---|
| Zoho Projects | Tareas, estados, sprints |
| Google Drive | Documentación larga (ADRs, RFCs, specs) |
| Repo GitHub | Código + docs técnicos |
| Raíz compu | Copia local (no es fuente de verdad propia) |

Se establece el **tridente operativo**:
- **Yair**: decisión, QA humano, aprobación
- **Opus**: especificación, ADRs, prompts (escribe en Drive y Zoho)
- **Code**: implementación (escribe solo en repo)

Se establece la regla DONE:
- DONE técnico ≠ terminado
- Solo DONE visual de Yair marca una tarea como `terminado`

## Consecuencias

- Cada superficie tiene un rol claro. No se duplica estado.
- Los ADRs de Drive tienen espejos en `docs/adr/` del repo.
- Zoho es la única fuente de verdad de estado de tareas.

## Referencias

- `docs/OPERATING-MODEL.md` — versión completa en el repo
