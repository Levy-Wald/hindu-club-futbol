# ClubCore — Sprint Plan

> Historial de sprints completados + sprint actual + proximos en cola.
> Para el roadmap completo por fases, ver `ROADMAP.md`.
>
> Mantenido por el arquitecto.
>
> Ultima actualizacion: 11 de mayo de 2026.

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

## FASE 2 — Comunicacion (2026-05-11)

| Sprint | Tema | Tag | Tests E2E | Estado |
|---|---|---|---|---|
| 2.1 | Motor de comunicacion core (mock-first): adapter pattern, MockAdapter, renderTemplate, enviarComunicacion, page con 2 tabs | `v0.4.0-fase2-sprint1-motor` | 16 pass, 1 skip | Cerrado |
| 2.2 | Editor CRUD de plantillas: editor con preview, auto-deteccion variables, permisos por atributo, proteccion sistema, 7 E2E tests | `v0.5.0-fase2-sprint2-editor` | 23 pass, 1 skip | Cerrado |
| 2.3 | Envios masivos con segmentacion MVP: wizard, segmentos (todos_activos, equipo), preview, bulk insert batches 500, lotes, historial, detalle lote, 11 E2E comunicaciones | `v0.6.0-fase2-sprint3-envios-masivos` | 26 pass, 1 skip | Cerrado |
| 2.4 | Cron vencimientos + recordatorios: 3 triggers (apto_vence_7d, cuota_vence_7d, cuota_vencida_7d), service role client, dedup 7d nativo, segmento personas_ids_directos, com_jobs_log, tab Automatizaciones, 4 E2E nuevos | `v0.7.0-fase2-sprint4-cron` | 30 pass, 1 skip | Cerrado |

---

## Sprint actual

### Sprint FASE 2.5 — Preferencias de canales por persona
**Capa:** Modulo (Comunicaciones) - **Fase:** FASE 2

**Objetivo.** Cada persona elige por que canal quiere recibir comunicaciones
(email, in-app, futuro whatsapp). El sistema respeta la preferencia al enviar.

**Dependencias previas.** Sprint FASE 2.4 cerrado. Tag `v0.7.0-fase2-sprint4-cron`.

---

## Proximos en cola

### Sprint FASE 3.1 — Control de asistencias operativo (mobile)
**Capa:** Modulo (Asistencias) - **Fase:** FASE 3

**Objetivo.** Tomar asistencia en entrenamientos y partidos desde mobile.

---

## Reglas

- Toda solicitud sigue `PROMPT-ENVELOPE.md`.
- Toda implementacion respeta `ARCHITECTURE.md`.
- Capa explicita declarada al inicio de cada sprint.
- `CURRENT-STATE.md` actualizado al cerrar.
- Sprints de alto riesgo requieren pre-mortem (R-PE9).
- Code NO modifica este doc. Solo lo consulta.
