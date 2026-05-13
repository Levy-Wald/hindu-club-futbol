# ClubCore — Sprint Plan

> Historial de sprints completados + sprint actual + proximos en cola.
> Para el roadmap completo por fases, ver `ROADMAP.md`.
>
> Mantenido por el arquitecto.
>
> Ultima actualizacion: 12 de mayo de 2026.

---

## FASE 1 — Cierre (2026-05-11)

| Sprint | Tema | Commit SHA | Deploy | Estado |
|---|---|---|---|---|
| 14d | Cleanup + docs base | b2a8337 | OK | Cerrado |
| 14d.5 | Design Tokens | 8eZHmU6 | OK | Cerrado |
| 14e | Suscripciones | 73beeb5 | OK | Cerrado |
| 14f | Emision cuotas | 73beeb5 | OK | Cerrado |
| 14g | Cobranza manual | 73beeb5 | OK | Cerrado |
| 14h | Centros de costo | f82a405 | OK | Cerrado |
| 14i | Vista global salud | 3a6f06d | OK | Cerrado |
| 14j | Utileria del club | 95c879e | OK | Cerrado |
| 14k.5 | Cuerpo tecnico + refactor permisos | df28d28 | OK | Cerrado |
| 14k | Notificaciones in-app | 10af608 | OK | Cerrado |
| 14j.2 | Concesiones genericas | 10af608 | OK | Cerrado |
| 14k.6 | Limpieza arquitectonica pre-FASE 2 | — | OK | Cerrado |
| 14k.7 | Hotfixes FASE 1 + UI completion | — | OK | Cerrado |
| 14k.8 | Estabilizacion | — | OK | Cerrado |
| 14k.9 | Cierre real FASE 1 | — | OK | Cerrado |

Tag: `v0.1.0-fase1-cierre`

---

## Foundation (2026-05-11)

| Sprint | Tema | Tag | Tests E2E | Estado |
|---|---|---|---|---|
| 15a | Foundation Declarativa: ADRs 031-033, 18 manifiestos, catalogo modulos extendido, ESLint rules, schema audit | `v0.2.0-foundation-declared` | — | Cerrado |
| 15b | Migracion fisica de modulos: 18 modulos a `modules/` con estructura canonica | `v0.3.0-modules-physical` | — | Cerrado |
| 15c | E2E Tests Verdes: Playwright config, usuario E2E, 16 pass + 1 skip | `v0.3.1-e2e-greenlit` | 16 pass, 1 skip | Cerrado |

---

## FASE 2 — Comunicacion (completada 2026-05-12)

| Sprint | Tema | Tag | Tests E2E | Estado |
|---|---|---|---|---|
| 2.1 | Motor de comunicacion core (mock-first): adapter pattern, MockAdapter, renderTemplate, enviarComunicacion, page con 2 tabs | `v0.4.0` | 16/1/0 | Cerrado |
| 2.2 | Editor CRUD de plantillas: editor con preview, auto-deteccion variables, permisos por atributo, proteccion sistema | `v0.5.0` | 23/1/0 | Cerrado |
| 2.3 | Envios masivos con segmentacion MVP: wizard, segmentos, preview, bulk insert, lotes, historial, detalle lote | `v0.6.0` | 26/1/0 | Cerrado |
| 2.4 | Cron vencimientos + recordatorios: 3 triggers, service role, dedup 7d nativo, com_jobs_log, tab Automatizaciones | `v0.7.0` | 30/1/0 | Cerrado |
| 2.4-FIX | Correccion semantica + E2E real con fixture: dot-notation permisos, origen_modulo_slug limpio | `v0.7.1` | 31/1/0 | Cerrado |
| 2.5 | Preferencias de comunicacion por persona: categoria_contenido, RPC filtro, UI en ficha persona | `v0.8.0` | 33/1/0 | Cerrado |

FASE 2 completada al 100% el 2026-05-12.

---

## FASE 3 — Operacion deportiva (completada 2026-05-12)

| Sprint | Tema | Tag | Tests E2E | Estado |
|---|---|---|---|---|
| 3.1 | Control de asistencias operativo (mobile): evento_invitados, auto-poblado lazy, 6 estados, React Query optimistic, permisos CT/admin | `v0.9.0` | 35/1/0 | Cerrado |
| 3.2 | Asistencia extendida a entidades y equipos: modelo polimórfico evento_asistencias, marca_asistencia, expandir equipo, 6 actions, 4 UI components | `v0.10.0` | 38/1/0 | Cerrado |
| 3.3 | Módulo acceso MVP: pantalla guardia mobile-first, veredicto verde/amarillo/rojo, RPC verificar_acceso_persona, acceso_logs audit trail, marcar presente desde acceso, 5 UI components | `v0.11.0` | 41/1/0 | Cerrado |
| 3.4 | Nóminas externas (RFC-001): sistema visitantes externos, form público sin auth, matching fuzzy, niveles L0/L1, padrón temporal, rate limiting, token criptográfico, admin confirmar/rechazar | `v0.12.0` | 44/1/0 | Cerrado |
| 3.5 | Integración acceso ↔ padrón temporal: RPC verificar_acceso_persona con visitante_temporal, CardVeredicto contexto visitante, 3 E2E tests | `v0.13.0` | 47/1/0 | Cerrado |

FASE 3 completada al 100% el 2026-05-12.

---

## Documentacion (2026-05-12)

| Sprint | Tema | Tag | Tests E2E | Estado |
|---|---|---|---|---|
| DOCS-7+UX-FIX | RFC-001 en repo, pre-mortem 3.4, modelo operativo canonizado, AP-003 a AP-006, sidebar con Acceso y Nóminas externas | `v0.13.1` | 49/1/0 | Cerrado |

## FASE 4 — Planificadores (2026-05-12)

| Sprint | Tema | Tag | Tests E2E | Estado |
|---|---|---|---|---|
| 4.1 | Planificador mensual con drag-and-drop: react-big-calendar, mover eventos, modal recurrentes, overlap warning, sidebar | `v0.14.0` | 53/1/0 | Cerrado |
| 4.2 | Planificador semanal con grilla + resize: grilla 6AM-11PM, drag move + resize, toggle Mes/Semana, sidebar Semanal | `v0.15.0` | 56/1/0 | Cerrado |
| 4.3 | Organizador de entrenamientos: módulo entrenamientos, 3 tablas, 20 ejercicios globales, plan 1:1 evento, bloques DnD, permisos CT | `v0.16.0` | 60/1/0 | Cerrado |

---

## Sprint actual

Pendiente de asignación por el Arquitecto.

---

## Proximos en cola

- Sprint 4.4: Organizador de amistosos
- Sprint 4.5: Planificador táctico
- Sprint 4.6: Reservas de cancha

---

## Reglas

- Toda solicitud sigue `PROMPT-ENVELOPE.md`.
- Toda implementacion respeta `ARCHITECTURE.md`.
- Capa explicita declarada al inicio de cada sprint.
- `CURRENT-STATE.md` actualizado al cerrar.
- Sprints de alto riesgo requieren pre-mortem (R-PE9).
- Code NO modifica este doc. Solo lo consulta.
