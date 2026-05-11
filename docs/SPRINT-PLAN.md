# ClubCore — Sprint Plan

> Sprint actual + proximos 3 en cola. Sin fechas comprometidas.
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

Tag: `v0.1.0-fase1-cierre`

---

## Sprint actual

### Sprint 15a — Resend + comunicaciones masivas
**Capa:** Modulo paralelo (Comunicaciones) - **Fase:** FASE 2

**Objetivo.** Emails reales saliendo de la plataforma: avisos de
vencimiento, recibos, comunicados.

**Alcance.**
- Configurar Resend (mock mode primero)
- Plantillas operativas (vencimiento, recibo, comunicado)
- UI de envio masivo
- Cron de vencimientos envia emails reales
- Preferencias de comunicacion por persona

**Cuello de botella:** DNS Resend (arrancar configuracion en paralelo).

**Dependencias previas.** FASE 1 cerrada. Tag `v0.1.0-fase1-cierre`.

---

## Proximos 3 en cola

### Sprint 15b — Reportes financieros basicos
**Capa:** Troncal ERP - **Fase:** FASE 7

**Objetivo.** Hindu puede ver balance mensual, ingresos/egresos por
categoria, deudores, recaudacion por equipo.

**Alcance resumido.**
- 5 reportes con filtros y export
- Asignacion de centro de costo a movimientos

---

### Sprint 15c — RRHH operativo
**Capa:** Modulo Paralelo - **Fase:** FASE 8

**Objetivo.** UI completa de contratos y liquidaciones.

**Alcance resumido.**
- Contratos UI completa con vigencia y PDF
- Liquidaciones con movimiento de caja
- Datos laborales tab completo

---

### Sprint 15d — Envios masivos + drip de deudores
**Capa:** Modulo paralelo (Comunicaciones) - **Fase:** FASE 2

**Objetivo.** Wizard de envio masivo completo con segmentos y tracking.

**Alcance resumido.**
- Wizard: segmento -> plantilla -> preview -> enviar
- Tracking (delivered, opened, bounced)
- Drip de recuperacion de deudores

---

## Reglas

- Toda solicitud sigue `PROMPT-ENVELOPE.md`.
- Toda implementacion respeta `ARCHITECTURE.md`.
- Capa explicita declarada al inicio de cada sprint.
- `CURRENT-STATE.md` actualizado al cerrar.
- Sprints de alto riesgo requieren pre-mortem (R-PE9).
- Code NO modifica este doc. Solo lo consulta.
