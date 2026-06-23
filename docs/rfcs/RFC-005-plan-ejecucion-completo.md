# RFC-005 v2.0 — Plan de ejecución completo a 100% (CANONIZADO)

> **Espejo de Drive** `_Arquitectura/RFCs/01-RFC-005-plan-ejecucion-completo-v2.0`. Fuente de verdad allí.
> Mirror traído al repo el **23-jun-2026** (Code, cobertura de Opus): el repo tenía la **v1.0**; esta v2.0 la supersede.
> **Nota de vocabulario:** este doc usa la nomenclatura vieja (Tramos 1-13 / FASE A-E). El framing operativo vigente es **F0-F10** (ver `docs/PHASES.md` Rosetta Stone, ADR-065). El **arco estratégico** de abajo sigue siendo el norte; los detalles tácticos (números de tramo, nombres de tag) quedaron superados por F0-F10.

**Versión**: 2.0 · **Fecha**: 18-may-2026 · **Status**: Accepted — fuente de verdad estratégica · **Autor**: Claude Opus (con Yair) · **Supersedes**: RFC-005 v1.0 (14-may)

## 0. Nota de versión v2.0

Incorpora: (1) estado real al 18-may (Tramos 1-4 cerrados + B7-FIX/B8/B9/B10); (2) ADR-055 capabilities multivertical; (3) ADR-056 navegación 3 niveles + 4 espacios; (4) ADR-057 navegación universal + acciones condicionales; (5) 10 mejoras (C0, D7, P7, E0, K12, K13, AG2, T7, AI6, AI7); (6) reordenamiento Tramo 10 paralelo (K1+K3+K4 críticos durante Tramo 8). Decisiones por **regla de promedio plus** (analizar referentes del mundo antes de decidir).

## 1. Contexto

RFC-004 estableció las 4 capas y el plan FASE A→E. RFC-005 v1.0 canonizó 13 tramos para llegar al 100%. Esta v2.0 refleja estado real + agrega 10 mejoras.

## 2. Mapa de tramos

| Tramo | Contenido | Status (18-may) |
|---|---|---|
| 1 | FASE A (troncal mínimo) | ✅ DONE |
| 2 | Hardening post-A (H1-H4) | ✅ DONE (absorbido) |
| 3 | FASE B vertical CCBP (B1-B6) | ✅ DONE |
| 4 | Hardening post-B (H5-H7) + B7-FIX/B8/B9/B10 | ✅ DONE / B10 ready |
| **5** | **FASE C Demo Hindu (C0 + C1-C5)** | ⏳ NEXT (quality gate) |
| 6 | FASE B' correcciones eventuales | Condicional |
| 7 | FASE D Cross-vertical extra (D1-D7) | Pending |
| 8 | Plataforma SaaS comercial-técnica (P1-P7) | Pending |
| 9 | FASE E Verticales nuevos (E0-E4) | Pending |
| 10 | Conectores Capa 3 (K1-K13) | Paralelo con 8 y 9 |
| 11 | API pública + Agent layer (API1-AG2) | Requiere RFC-005a |
| 12 | Plataforma técnica madura (T1-T7) | Pending |
| 13 | IA nativa (AI1-AI7) | Opcional |

**Orden de dependencias:** 1→2→3→4→5→[6?]→7→8→9, con 10 en paralelo (K1+K3+K4 con 8; resto con 9), luego 11→12→13.

**Hitos críticos:** Tramo 5 (Demo Hindu) = quality gate (si falla, vuelta a B'). Tramo 8 (SaaS comercial) = prerequisito de Tramo 9. Tramo 10 (conectores) multiplica valor (mock-first hasta acá). Tramo 11 (API) requiere RFC-005a formal.

## 3. Detalle por tramo (resumen)

- **Tramos 1-4 (DONE):** FASE A (tag v0.29.0, 21 sprints, ~80h) · FASE B CCBP (tag v0.30.0, B1-B6, ~30h) · Hardening post-B (tag v0.30.5, H5-H7) · Extensión B7-FIX/B8 capabilities/B9 navegación/B10 Mi Día (~20-25h).
- **Tramo 5 — FASE C Demo Hindu (NEXT):** C0 Onboarding visible (★, 2-3h) + C1 reset DB + backup, C2 carga inicial importadores, C3 operación real staff Hindu (5-7 días), C4 feedback estructurado, C5 decisión binaria (aprobado / requiere B'). Quality gate.
- **Tramo 6 — FASE B':** condicional según C5.
- **Tramo 7 — FASE D (~36-42h):** D1 documentos+firma (mock), D2 tickets/solicitudes universalizado, D3 pricing N2 (cerrar parcial), D4 stock N3 (cerrar parcial), D5 consolidación tablas paralelas (RIESGO ALTO), D6 mapa visual cross-vertical, **D7 importadores universales** (★).
- **Tramo 8 — Plataforma SaaS comercial (~32-41h):** P1 multi-tenancy real (planes + suscripciones + límites), P2 self-service onboarding, P3 marketplace módulos, P4 billing interno, P5 super-admin global, P6 tenant impersonation, **P7 white-label por tenant** (★).
- **Tramo 9 — FASE E verticales (~129h):** **E0 Country/Barrio Privado** (★, ~25h, vertical primario junto a CCBP), E1 Arquitectura (~25h), E2 Abogacía (~23h, Kate), E3 Publicidad (~21h), E4 Retail (~35h, Pergamino).
- **Tramo 10 — Conectores K1-K13 (~69h):** críticos (paralelo Tramo 8): K1 Resend, K3 MercadoPago, K4 AFIP — sin estos un tenant nuevo no opera real. Verticales (paralelo Tramo 9): K2 WhatsApp, K6 Calendar. Bajo demanda: K5 Stripe, K7 Tiendanube/Shopify, K8 R2, K9 Document AI, K10 PIM enterprise, K11 Slack/Discord/Teams, **K12 Brevo** (★), **K13 Telegram** (★).
- **Tramo 11 — API + Agent (~52-53h, requiere RFC-005a):** API1 auth, API2 REST v1, API3 webhooks, API4 OpenAPI catalog, API5 SDKs, API6 docs viva, AG1 Agent Connector, **AG2 MCP Server oficial** (★).
- **Tramo 12 — Plataforma madura (~40-41h):** T1 observability, T2 backups+DR, T3 multi-region, T4 performance, T5 seguridad (pentest/SOC2), T6 CI/CD endurecido, **T7 status page** (★).
- **Tramo 13 — IA nativa (~39-40h, opcional):** AI1 asistente embebido por vertical, AI2 auto-clasificación tickets, AI3 sugerencias scouting, AI4 churn socios, AI5 OCR docs, **AI6 resumen ejecutivo IA** (★), **AI7 acciones por voz vía WhatsApp** (★, endgame).

## 4. Resumen ejecutivo

**Total post-B10:** ~95 sprints, **~410-470h Code**. Al 18-may: ~33 sprints ejecutados (~35% en cantidad de sprints, ~25% en horas Code).

## 5. Las 10 mejoras (justificación)

C0 onboarding pre-demo (dispara éxito de C3) · D7 importadores universales (onboarding verticales) · P7 white-label (multiplica precio cobrable) · E0 Country (vertical primario, capabilities ya creadas en B8) · K12 Brevo (tier free SMB) · K13 Telegram (sin friction Meta) · AG2 MCP Server (endgame conversacional) · T7 status page (trust SLA) · AI6 resumen ejecutivo · AI7 voz WhatsApp (endgame canonizado).

## 6. Reglas operativas vigentes

1. **Mock-first universal** hasta Tramo 10.
2. **Yair NO programa**, solo opera prod Vercel.
3. **Auditoría MCP pre-tag obligatoria** (ADR-047): FKs salientes, RLS+triggers+soft-delete, drift TS↔BD.
4. **Sub-sprints como modus operandi**.
5. **Tag obligatorio antes del siguiente sprint**.
6. **NO tests con personas reales de Hindu** (sintéticos o ciclo real con cliente).
7. **`trg_set_updated_at`** (NO `set_updated_at`).
8. **External constraints**: sin Resend/MercadoPago/CUIT Hindu/dominios — mock-first mitiga hasta Tramo 10.
9. **Regla de promedio plus**: antes de decisión arquitectónica/UX/modelo, analizar referentes (Stripe/Linear/Notion/Shopify/Figma/Slack/Vercel/Salesforce/Google), calcular promedio plus, partir de ahí. Desviarse requiere permiso + justificación.

## 7. Referencias

RFC-004 (4 capas), ADR-040 a ADR-057, SPRINT-PLAN v3.0 (companion operativo, archivado en Drive), ROADMAP-MASTER v2.0 (parcialmente superseded). Framing vigente: `docs/PHASES.md` (F0-F10).

**Fin RFC-005 v2.0.**
