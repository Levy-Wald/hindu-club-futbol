# SPRINT PLAN — v3.0

**Última actualización:** 26-may-2026 (sincronizado con Drive v3.0 del 18-may-2026)  
**Drive doc id:** `1nxKznU-hVjZ3gDq-oO5TRHSYXpGkgLmTeY80E80G9Pc`  
**Reemplaza:** v2.1 (14-may-2026) en el repo.

Este es el **plan estratégico global** del producto. Cubre desde el estado actual hasta producto comercial completo.

**Jerarquía de roadmaps vigentes:**

1. **Estratégico GLOBAL (este documento):** SPRINT-PLAN v3.0 + RFC-005 v2.0. 13 tramos T1-T13.
2. **Táctico CORTO PLAZO:** ROADMAP post-B17 (21-may) en Drive `_Roadmap/`. Sustituye PARCIALMENTE al v3.0 en Tramo 5.
3. **Deuda técnica:** PLAN-DEUDA-TECNICA-POST-AUDIT en Drive `_Roadmap/`.

---

## Resumen ejecutivo

| Concepto | Valor |
|---|---|
| Tramos definidos | **13** (T1-T13) |
| Horas Code estimadas restantes | **~410-470h** |
| Fase actual | **B** (Backend Multi-tenant + UI Operativa) ~90% |
| Próximo sprint | **B18** — Sidebar BO Universal 7 espacios |
| Cliente piloto | Hindu Club Fútbol (2.390 socios) |

---

## Estructura por fases

| Fase | Nombre | Sprints | Estado | Tramos |
|---|---|---|---|---|
| **A** | MVP funcional + datos reales | A1-A6 | ✅ Cerrada | T1-T2 |
| **B** | Backend multi-tenant + UI operativa | B0-B18 | 🟡 90% | T3-T4 |
| **C** | Portal Cliente Completo | C0-C5 | ⚪ Pendiente | T5-T8 |
| **D** | Operación + documentación + ventas | D1-D... | ⚪ Pendiente | T9-T13 |

---

## Tramos T1-T13 (planeación detallada)

### T1 — Bootstrap producto (✅ cerrado)

- Schema Postgres inicial.
- Setup Next.js + Supabase + Vercel.
- Auth básico.
- **Sprints:** A1-A3.

### T2 — Datos reales + UI primera versión (✅ cerrado)

- Carga de 2.390 socios de Hindu.
- UI BO inicial.
- **Sprints:** A4-A6.

### T3 — Multi-tenancy + RLS hardening (✅ cerrado)

- Migración a arquitectura multi-tenant con `tenant_id`.
- 355 RLS policies aplicadas.
- Auditoría RLS coverage.
- **Sprints:** B0-B12.

### T4 — Módulos productivos + UI consolidación (🟡 90%)

- 37 módulos productivos sobre 91 catalogados.
- Action bars universales (B15).
- Diagnósticos y refactores (B13, B17).
- **Sprints:** B13-B17.
- **Próximo:** B18 (sidebar BO universal 7 espacios).

### T5 — Portal Cliente Completo (⚪ próxima fase grande)

> **Nota:** Este tramo fue redefinido por el ROADMAP post-B17 (21-may).  
> El v3.0 original lo planteaba como "C0 Onboarding 2-3h".  
> El post-B17 lo redefine como "Portal Cliente Completo 40-56h en 8 sub-sprints".

Sub-sprints C0:

1. **C0.1** — Layout PC mobile-first base.
2. **C0.2** — Login / signup socio.
3. **C0.3** — Dashboard socio (estado cuotas + eventos).
4. **C0.4** — Pago de cuotas (mock primero, MercadoPago después).
5. **C0.5** — Inscripción a eventos.
6. **C0.6** — Perfil socio + dependientes.
7. **C0.7** — Notificaciones in-app.
8. **C0.8** — Recovery de password + flujos secundarios.

**Estimación:** 40-56h Code.

### T6 — Comunicación y notificaciones (⚪)

- Resend integrado (transactional email).
- Templates de email.
- Comunicados masivos desde BO.
- **Bloqueante:** setup Resend (post-CUIT SCL).

### T7 — Pagos productivos (⚪)

- MercadoPago integrado real.
- Conciliación automática.
- Reportes de cobranza.
- **Bloqueante:** CUIT SCL + CUIT Hindu.

### T8 — Reportes + Dashboards (⚪)

- Dashboards de tesorería, socios activos/inactivos, eventos.
- Exportaciones (CSV, PDF).
- Reportes programados.

### T9 — Auditoría completa + compliance (⚪)

- Audit trail inmutable extendido.
- Logs accesibles desde BO.
- Compliance datos personales (Ley 25.326 AR).
- DPA con subprocesadores.

### T10 — Onboarding self-service (⚪)

- Wizard de creación de tenant nuevo (cliente puede onboardear solo).
- Carga inicial CSV con validaciones.
- Templates de configuración por tipo de club.

### T11 — Marketing site + ventas (⚪)

- Site institucional ClubCore (separado de este repo).
- Demo interactiva.
- Material comercial.

### T12 — Segundo cliente ClubCore (⚪)

- Onboarding tenant nuevo en producción.
- Validación que el modelo escala.
- Iteración sobre fricciones detectadas.

### T13 — Bundle AsocCore (segunda vertical) (⚪)

- Reutilización del 80% del catálogo ClubCore.
- 20% módulos nuevos específicos asociaciones.
- Primer cliente AsocCore.

---

## Tramos del ROADMAP post-B17 (táctico corto plazo)

El ROADMAP post-B17 introduce **numeración propia** que **se solapa** con T1-T13 pero es más granular para el corto plazo. **Tabla de mapeo:**

| Tramo post-B17 | Equivalente v3.0 | Contenido |
|---|---|---|
| T0 | — | B17 cierre + auditoría |
| T1 | T4 final | B18 Sidebar BO Universal |
| T2 | T4 → T5 transición | Nav Universal + QA Round + C0 prep |
| T3 | T5 | C0 Portal Cliente Completo (C0.1-C0.8) |
| T4 | T6-T7 | Comunicación + Pagos productivos |
| T5 | T8 | Reportes + Dashboards |
| T6 | T9+ | Compliance + onboarding + ventas |

**Al hablar de "Tramo X", aclarar siempre cuál numeración se usa.**

---

## Próximo sprint: B18

**Nombre:** B18 — Sidebar BO Universal (7 espacios cross-vertical)  
**Estimación:** 8-12h Code  
**ADR referencia:** ADR-039 + ADR-042 (FORMAL)  
**Tag esperado al cierre:** `v0.30.25-b18-sidebar-universal-7-espacios`

**Estado de preparación:**

- ✅ Prompt detallado en Drive `_Sprints/Fase-B-C/PROMPT-B18.md`.
- ✅ BD preparada: columnas `area_sidebar_bo`, `sub_area_sidebar_bo`, `nombre_display`, `prioridad_fase_c`, `interfaz_primaria` ya existen.
- ✅ ADR-039 vigente.
- ✅ Sidebar viejo identificado para reemplazo.

**Después de B18:**

1. **QA Round dedicado** (6-10h) — validación cruzada de todo el sidebar.
2. **C0 Portal Cliente Completo** (40-56h en 8 sub-sprints).

---

## Sprints históricos cerrados

### Fase A (cerrada)

- **A1-A2:** Setup inicial, schema, primeras tablas.
- **A3:** Auth básico.
- **A4:** Carga de socios Hindu (2.390 personas).
- **A5:** UI BO primera versión.
- **A6:** Estabilización post-carga.

### Fase B (90% cerrada)

- **B0:** Refactor a multi-tenant. Tag `v0.20.0-multitenant`.
- **B1-B6:** Módulos personas + cuotas + eventos.
- **B7-B10:** Módulos contabilidad + reportes.
- **B11-B12:** RLS hardening completo (355 políticas).
- **B13:** Auditoría matriz + refactor UI.
- **B14:** Action bars iniciales.
- **B15:** Inventario action bars + estandarización.
- **B16:** Pre-mortem fase B17.
- **B17:** Diagnóstico cross-módulo. Cierre con tag `v0.30.24-b17`.
- **Docs reorg:** PR #7. Tag `v0.30.24.1-docs-reorg`.

Historial completo: `docs/sprints/B-series/`.

---

## Capacidad y velocidad real

| Métrica | Valor histórico |
|---|---|
| Horas Code por semana | ~15-25h (variable) |
| Tiempo promedio por sprint B | 6-12h Code |
| Sprints completados Fase B | 17 (B0-B17) + docs reorg |
| Tasa de regresiones | Baja (1-2 hotfixes post-merge) |
| Cobertura de tests E2E | Happy paths principales cubiertos |

**Proyección honesta:**

- **B18 + QA Round:** 1-2 semanas.
- **C0 Portal Cliente (8 sub-sprints):** 4-8 semanas.
- **T6-T8 (comunicación + pagos + reportes):** bloqueado por CUIT + integraciones.
- **Producto comercial completo (T1-T13):** 6-12 meses adicionales según ritmo.

---

## Riesgos del plan

| Riesgo | Mitigación |
|---|---|
| CUIT SCL en trámite IGJ se demora | Avanzar todo lo no-bloqueado mientras tanto |
| Resend / MercadoPago integración lenta | Mock-first universal (ADR-035) |
| Hindu detecta bugs en producción | Tener QA Round antes de habilitar producción real |
| Code se desvía de scope | CLAUDE.md raíz + 12 puntos de checklist obligatorio |
| Documentación desactualizada | Auditorías cada 4-6 semanas + sync post-cierre fase |

---

## Documentos relacionados

- `MASTER-PROJECT.md` — modelo conceptual.
- `CURRENT-STATE.md` — estado actual concreto.
- `MODULE-CATALOG.md` — 91 módulos catalogados.
- `DATA-MODEL.md` — 169 tablas.
- `DECISIONS.md` + `adr/` — ADRs vinculantes.
- `audits/AUDIT-ARQUITECTONICA-2026-05-26.md` — auditoría arquitectónica más reciente.

---

**Fuente de verdad final:** Drive doc `1nxKznU-hVjZ3gDq-oO5TRHSYXpGkgLmTeY80E80G9Pc` (SPRINT-PLAN v3.0). Este archivo es la copia consolidada en repo.
