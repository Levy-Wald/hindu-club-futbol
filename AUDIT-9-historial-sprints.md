# PARTE 9 — Historial de sprints

## 9.1 Cronología de sprints (desde 14a hasta hoy)

> Nota: Sprints 1-11.1 se ejecutaron entre 2026-05-04 y 2026-05-06, todos en contexto de setup inicial del v2.
> **Total: 40 commits desde 2026-05-07** (Sprints 11.5 a 14c.2).

| Fecha | Commit | Sprint | Resumen |
|-------|--------|--------|---------|
| 2026-05-07 | `998ab6b` | 11.5 | Fix: next/image config, operaciones Select crash, error handling |
| 2026-05-07 | `d53aff7` | 11.5 | Feat: repetir eventos estilo Google Calendar |
| 2026-05-07 | `9329295` | 11.5 | Feat: opciones quincenal y mensual en recurrencia |
| 2026-05-07 | `6252aae` | UX | Feat: vistas dinámicas en Personas — todas las columnas + export respeta vista |
| 2026-05-07 | `8799b0a` | 11.6+11.7 | Feat: atributos namespacing + fin_* views |
| 2026-05-07 | `3cb9c49` | docs | Docs: actualizar MASTER-GAPS post 11.5-11.7 |
| 2026-05-07 | `5d38036` | 12 | Feat: Sprint 12 — Comunicaciones + Notificaciones |
| 2026-05-07 | `3fd7e69` | docs | Docs: marcar Sprint 12 como HECHO |
| 2026-05-07 | `74b10ed` | 13 | Sprint 13: API REST v1 + API Keys + rate limiting |
| 2026-05-07 | `8faee38` | 14a | Sync de padrones: parsers Excel, procesador de diffs, UI revisión |
| 2026-05-07 | `32cc0ca` | 14a.5 | UI interactiva: búsqueda, filtros, paginación, selección, acciones bulk, edición individual |
| 2026-05-07 | `7ba1057` | 14a.5 | Docs: actualizar MASTER-GAPS |
| 2026-05-07 | `6d5eb7f` | 14a.6 | Fix: barra de progreso + filtro headers Excel |
| 2026-05-07 | `d17f275` | 14a.6 | Fix: parser detecta headers reales + filtra filas junk |
| 2026-05-07 | `d7dd2b0` | 14a.6 | Fix: split automático de "APELLIDO Y NOMBRE" |
| 2026-05-07 | `9cf6280` | 14a.6 | Fix: auto-detector no mapea columnas vacías |
| 2026-05-07 | `d67dab4` | 14a.6 | Fix: parseo fechas MM/DD y DD/MM |
| 2026-05-07 | `b5ad119` | 14a.6 | Feat: unificación import/sync + fixes Hindu |
| 2026-05-08 | `899aab5` | 14a.7 | Fix: paginación obtenerDiffIds (límite 1000 Supabase) |
| 2026-05-08 | `ee5aed6` | 14a.7 | Perf: bulk insert en aplicarSync (200/batch, ~10x) |
| 2026-05-08 | `8ae5fd7` | 14a.7 | Feat: parser robusto nombres + detección persona jurídica |
| 2026-05-08 | `a3061d0` | 14a.7+ | Feat: deportes múltiples en ficha + import llena deportes |
| 2026-05-08 | `4a60997` | 14a.7+ | Fix: bulk insert altas incluye deportes + socio_padron |
| 2026-05-08 | `856e46a` | 14a.7+ | Fix: barra progreso lee DB real + modo dry run |
| 2026-05-08 | `4bc2936` | 14a.7+ | Fix: 3 bugs importador (deportes, socio_padron, estado CHECK) |
| 2026-05-08 | `3b49fa4` | 14a.7+ | Feat: tab Errores en sync padrón |
| 2026-05-08 | `bcb714e` | 14a.9 | Feat: fusión manual de personas duplicadas |
| 2026-05-08 | `9725fb3` | 14a.9 | Fix: fusión usaba RLS client que bloqueaba |
| 2026-05-08 | `712a5d9` | 14a.9 | Debug: fusión muestra error detallado |
| 2026-05-08 | `e0837a9` | 14a.9 | Fix: fusión fallaba por ambigüedad FK join |
| 2026-05-08 | `c2dcee6` | 14c.0 | Feat: plataforma ingestión genérica (import_pipelines, import_runs, import_rows) |
| 2026-05-08 | `9cd84ee` | 14c.0.1 | Feat: match_persona_fuzzy con scoring por tokens |
| 2026-05-09 | `ba24214` | 14c.1 | Feat: UI genérica imports + parser agrupado + pipeline jugadores |
| 2026-05-09 | `ec42926` | 14c.1.1 | Feat: integrar imports dentro de padrones + fix legacy sync |
| 2026-05-09 | `fa367dd` | 14c.1.1 | Fix: acciones para sin_match + columna Equipo en review |
| 2026-05-09 | `811ca54` | 14c.1.1 | Fix: normalize_name apóstrofes + split 1-letter prefix + reprocesar matching |
| 2026-05-10 | `1f152ea` | 14c.1.2 | Fix: crear persona sin DNI + re-apply fallados + UX apply |
| 2026-05-10 | `bfb1275` | 14c.1.3 | Fix: insertar_personas_equipos verifica requiere_revision directo en DB |
| 2026-05-10 | `6cd30c7` | 14c.1.4 | Feat: sección Sincronizaciones en detalle de padrón |
| 2026-05-10 | `bd9a7c1` | 14c.2 | Feat: pipeline suscriptores_por_equipo + padrón + atributo |

**Total commits Sprint 14:** 30 commits en 4 días.

## 9.2 Estado real vs plan original

### Plan original de sprints (de CLAUDE.md):
```
Sprint 14 = Mantenimiento + Mapa + Inventario + Reservas
```

### Lo que realmente se ejecutó como Sprint 14:
```
Sprint 14a   = Sync padrones (parsers, procesador, diffs)
Sprint 14a.5 = UI interactiva de revisión
Sprint 14a.6 = Unificación import/sync + fixes
Sprint 14a.7 = Velocidad + parser robusto de nombres
Sprint 14a.9 = Fusión manual de personas duplicadas
Sprint 14c.0 = Plataforma de ingestión genérica
Sprint 14c.0.1 = Match fuzzy por tokens
Sprint 14c.1 = Import jugadores por equipo + UI genérica
Sprint 14c.1.1-1.4 = Bugfixes y mejoras de imports
Sprint 14c.2 = Pipeline suscriptores
```

**Mantenimiento, Mapa, Inventario, Reservas → NO se ejecutaron.** El Sprint 14 entero se dedicó a importación de datos.

## 9.3 MASTER-GAPS.md (contenido completo)

> El contenido completo de MASTER-GAPS.md ya fue leído en esta sesión. Puntos clave de desalineamiento:
>
> - El header dice "Sprint 14a.7 EN PROGRESO" — en realidad estamos en Sprint 14c.2 completado
> - La sección "Sprint 14c" dice "PENDIENTE" — en realidad fue ejecutado (14c.0 a 14c.2)
> - Las estadísticas de DB dicen "90 tablas" — post-Sprint 14c son ~95+
> - La fecha dice "2026-05-07" — último cambio real fue 2026-05-10

## 9.4 NEXT-SPRINT.md (contenido completo)

> Apunta a "Sprint 14 — Mantenimiento + Inventario + Reservas + Mapa"
> Esto nunca se ejecutó. El Sprint 14 real fue importadores.
> Este archivo necesita reescritura completa.

## 9.5 Resumen de pendientes post-auditoría

### PENDIENTE_VALIDACION_VISUAL:
1. Run `ef766503` re-apply (post Bug B fix)
2. Test E2E pipeline `suscriptores_por_equipo` con xlsx de 57 filas
3. Sprints 9, 10, 11 — validación visual por Yair (lleva pendiente desde Sprint 11)

### Documentación a actualizar:
1. CLAUDE.md — tabla de sprints
2. MASTER-GAPS.md — estado real (14c.2 completado)
3. NEXT-SPRINT.md — reescribir por completo
4. README.md — stats DB + estructura

### Configuración Vercel pendiente:
1. `RESEND_API_KEY` — para emails
2. `CRON_SECRET` — para proteger crons
3. `SUPABASE_SERVICE_ROLE_KEY` — para API v1

### Deuda técnica prioritaria:
1. Deprecar sistema legacy de sync (padron_syncs)
2. Tests E2E (Sprint 16)
3. Capa de servicios pura (D3 — nunca implementado)
4. module_events (D6 — nunca implementado)
