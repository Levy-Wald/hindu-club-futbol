# CURRENT STATE — Estado actual del producto

**Última actualización:** 26-may-2026  
**Tag asociado:** `v0.30.24.2-docs-sync` (próximo `v0.30.24.3-docs-alignment`)  
**Versión documento:** v3.3

Este documento describe **qué está hecho hoy, qué falta y qué está bloqueado** en la Plataforma SaaS Multimodal. Lectura estimada: 20 min.

> **Vocabulario:** este doc usa los términos canónicos definidos en `docs/GLOSSARY.md`. Si hay ambigüedad, GLOSSARY gana.

---

## TL;DR

| Item | Estado |
|---|---|
| **Producto** | Plataforma SaaS Multimodal |
| **Vertical activa** | CCBP (Clubes, Countries y Barrios Privados) |
| **Cliente productivo** | Hindu Club Fútbol (2.390 socios cargados) |
| **URL producción** | https://hindu-club.vercel.app |
| **Tag actual** | `v0.30.24.2-docs-sync` |
| **Próximo sprint** | B18 — Sidebar BO Universal 7 espacios |
| **Roadmap (ROADMAP.md v2.0)** | Fases A y B completas. Próxima: Fase 6 (Portal Cliente Completo). |
| **Score arquitectónico** | 7.8/10 (auditoría 26-may-2026) |
| **Bloqueante crítico** | CUIT SCL en trámite IGJ (legal, no técnico) |

---

## Modelo conceptual (resumen)

**4 capas** definidas en ADR-031:

- **Capa 0 — Troncal:** CRM, ERP, PIM, Plataforma. Universal.
- **Capa 1 — Módulos:** 18 built-in, portables, declaran contrato en `module.json`.
- **Capa 2 — Verticales:** presets (CCBP activo, Arq/Abog/Pub/Retail catalogados).
- **Capa 3 — Conectores:** Resend, MercadoPago, WhatsApp (todos mock hasta FASE 16).

Detalle completo: `docs/ARCHITECTURE.md` (canónico v3) + `docs/SYSTEM-DESIGN.md` (v2.0 post RFC-004).

---

## Métricas técnicas

### Snapshot al 6-may-2026 (DATA-MODEL.md + MODULE-CATALOG.md)

| Métrica | Valor |
|---|---|
| Tablas Supabase | **140** |
| Vistas SQL | **27** |
| Funciones SQL | **~45** |
| Módulos físicos en `modules/` | **29** (22 DONE, 2 PARCIAL, 4 HUÉRFANO, 1 NO UI) |
| Módulos built-in canónicos | **18** |

### Snapshot al 26-may-2026 (auditoría arquitectónica)

| Métrica | Valor |
|---|---|
| Tablas Supabase | **~169** (creció ~29 tablas en 20 días por sprints B13-B17) |
| Políticas RLS activas | **355** |
| Funciones SQL | **~126** (creció por funciones helper de sprints recientes) |
| Triggers | **97** |
| LOC totales | **~128.764** |
| Archivos código | **834** |
| Tests unit passing | **137** |

> **Discrepancia explicada:** los docs canónicos (`DATA-MODEL.md`, `POSTGRES.md`) reflejan el schema al 6-may. La auditoría 26-may registró el snapshot vivo actual. Para snapshot del día, consultar Supabase directamente.

### Deploy

| Métrica | Valor |
|---|---|
| Status producción | ✅ READY |
| URL | https://hindu-club.vercel.app |
| Team Vercel | `team_clOmQCObDDN8okRHBc4wRhZ9` |
| CI / Actions | Verde en main |
| Deploys recientes | Auto-deploy en cada push a main |

---

## Qué funciona hoy (productivo en `hindu-club.vercel.app`)

### Back Office (BO) — Capa 0 Troncal + Módulos Capa 1

| Área | Status | Notas |
|---|---|---|
| **Auth + Login** | ✅ | Funcional, falta MFA |
| **Listado de personas** | ✅ | 2.390 socios cargados, búsqueda funcional |
| **Detalle de persona** | ✅ | Edición + historial |
| **Familias y dependientes** | ✅ | Vínculos tutor-menor (ver `docs/MENORES-TUTORES.md`) |
| **Gestión de cuotas** | ✅ | Generación masiva + ajustes individuales |
| **Eventos básicos** | ✅ | Crear + listar |
| **Contabilidad básica** | 🟡 | Plan de cuentas + asientos manuales. Falta automatización. |
| **Reportes** | 🟡 | Listas básicas. Faltan dashboards. |
| **Usuarios y roles BO** | ✅ | Multi-rol funcional |
| **Configuración tenant** | 🟡 | Parcial. Falta wizard onboarding. |
| **Audit trail** | ✅ | Inmutable, accesible via SQL. Falta UI. |
| **Sidebar BO** | ⚠️ | Antiguo, será refactorizado en B18 a 7 espacios universales (ADR-039) |

### Portal del Cliente (PC) — Pendiente Fase 6 ROADMAP

| Módulo PC | Status | Fase ROADMAP |
|---|---|---|
| Layout PC mobile-first | ⚪ | Fase 6 |
| Login + signup socio | 🟡 Parcial | Fase 6 |
| Dashboard socio | ⚪ | Fase 6 |
| Pago de cuotas | 🔴 Bloqueado (MercadoPago) | Fase 6 + 7 |
| Inscripción a eventos | ⚪ | Fase 6 |
| Perfil + dependientes | ⚪ | Fase 6 |
| Notificaciones | ⚪ | Fase 6 |

### Multi-tenancy

- ✅ Schema unificado con `tenant_id` en todas las tablas productivas.
- ✅ 355 políticas RLS validadas.
- ⚠️ 10 tablas pendientes de habilitar RLS (Tier 1 deuda técnica, ~30 min fix).
- ✅ Auth JWT propaga `tenant_id` correctamente.
- ✅ Tests E2E validan aislamiento entre tenants demo.

---

## Qué falta — según ROADMAP.md v2.0 (17 fases)

El roadmap canónico (`docs/ROADMAP.md`) ordena por **dependencias técnicas y comerciales**, no por calendario.

### Fases cerradas

- ✅ **Fases 1-5** — Bootstrap, schema inicial, datos reales, UI primera versión, multi-tenancy.
- ✅ **Fase A** — MVP funcional con datos reales (Hindu cargado).
- ✅ **Fase B** — Backend multi-tenant + UI operativa.

### En curso / próximas

| Fase | Descripción | Estado |
|---|---|---|
| **B18 (cierre Fase B)** | Sidebar BO Universal 7 espacios cross-vertical | Próximo sprint |
| **QA Round** | Validación cruzada post-B18 | Después de B18 |
| **Fase 6** | Portal Cliente Completo (~40-56h en 8 sub-sprints) | Próxima fase mayor |
| **Fase 7-8** | Comunicaciones avanzadas | Bloqueado por Resend |
| **Fase 9** | IA (agentes, asistentes — ver `docs/SYSTEM-PROMPTS.md`) | Catalogado |
| **Fase 10-15** | Verticales nuevas (Arq, Abog, Pub, Retail) | Post-Hindu validado |
| **Fase 16** | Producción real (Resend + MercadoPago salen de mock) | Bloqueado por CUIT |
| **Fase 17** | Billing + marketplace de módulos | Final |

Detalle por fase: `docs/ROADMAP.md`.

---

## Bloqueantes activos

| Bloqueante | Impacta | ETA fix |
|---|---|---|
| **CUIT SCL en trámite IGJ** | Pre-launch productivo, FASE 16 entera | Depende IGJ |
| **Resend (transactional email)** | Confirmaciones, recovery password, comunicados | Setup post-CUIT |
| **MercadoPago integración** | Pago de cuotas productivo (Fase 6.4 + Fase 7) | Setup post-CUIT |
| **CUIT Hindu Club** | Facturación a Hindu | Cliente debe gestionar |
| **Dominios Hindu** | Email + portal cliente con dominio propio | Cliente debe gestionar |

**Mientras tanto:** ADR-035 mock-first universal vigente — todo se desarrolla contra mocks.

---

## Deuda técnica resumida (auditoría 26-may-2026)

**Score:** 7.8/10 (sólido).  
**Total acciones identificadas:** 14, en 4 tiers.

### Tier 1 — Crítico, ~4-6h fix

| Acción | Estimación |
|---|---|
| Fix vitest alias `@/` | 15 min |
| Eliminar dead deps `react-hook-form` | 10 min |
| Habilitar RLS en 10 tablas faltantes | 30 min |
| Drop `eventos_backup_20260522` | 5 min |
| Fix 541 errores TS strict (mecánicos, 0% lógica) | ~10h fix |

### Tier 2-4

- Refactor de patrones detectados (`docs/audits/AUDIT-PATRONES-ARQUITECTONICOS-2026-05-26.md`).
- Mejoras de testing (`docs/audits/AUDIT-TESTING-CODEHEALTH-2026-05-26.md`).

**Detalle completo:** `docs/audits/AUDIT-ARQUITECTONICA-2026-05-26.md`.

---

## Cambios recientes (últimos 30 días)

| Fecha | Cambio | Tag |
|---|---|---|
| 26-may | PR #9 docs alignment con sistema canónico | `v0.30.24.3-docs-alignment` (próximo) |
| 26-may | PR #8 docs content update (resultó parcialmente desalineado) | `v0.30.24.2-docs-sync` |
| 26-may | PR #7 reorganización física de docs | `v0.30.24.1-docs-reorg` |
| 26-may | Auditoría arquitectónica completa — 4 docs en `audits/` | — |
| 22-may | B17 cierre | `v0.30.24-b17` |
| 21-may | ROADMAP post-B17 creado en Drive | — |
| 18-may | RFC-005 v2.0 (FUENTE DE VERDAD estratégica) | — |
| 15-may | ARCHITECTURE.md v3 canónico (Sprint H4 Hardening) | — |
| 13-may | ROADMAP.md v2.0 + SYSTEM-DESIGN.md v2.0 + GLOSSARY actualizado (post RFC-004) | — |
| 13-may | BRAND-PLATFORM.md + DESIGN-SYSTEM.md v2.0 + UI-UX-PATTERNS.md + VISUAL-GALLERY.md | — |
| 11-may | UI-UX.md + PERFORMANCE.md + SECURITY.md + E2E-TESTING.md | — |
| 12-may | SYSTEM-PROMPTS.md | — |
| 7-may | API.md | — |
| 6-may | DATA-MODEL.md + POSTGRES.md snapshot | — |
| 5-may | MENORES-TUTORES.md | — |

---

## Drive del proyecto

**Raíz:** https://drive.google.com/drive/folders/1cZVm440-tL7qgCmqe6ONDu26qvyprj98

**Documentos vivos en raíz Drive:**

- `00-MASTER-INDEX-v2.2.md`
- `BOOT-CONTINUIDAD-26-MAY-2026-v3.md`
- `COMO-SEGUIMOS-v1.1.md`
- `CURRENT-STATE-v3.2-26-MAY-2026.md`

**Carpetas principales:**

- `_Arquitectura/` (RFCs)
- `_Auditorias/`
- `_Cierre Ejecutivo/`
- `_Decisiones/` (ADRs copia desde repo)
- `_Materiales-Comerciales/`
- `_Roadmap/` (ROADMAP v2.0, post-B17, deuda técnica)
- `_Sprints/` (prompts de sprints)
- `_Verticales/`
- `_Archivo/`

---

## Persona / Contacto

| Rol | Persona |
|---|---|
| **CEO + Product Owner** | Yair Ricardo Levy Wald |
| **Arquitecto (IA)** | Claude Opus 4.x |
| **Ejecutor código (IA)** | Claude Code (sesiones por sprint) |
| **Legal** | Kate Feldman (CPACF) |

**Email:** yair@levywald.com  
**Tel:** +54 9 11 5014 8932

---

## Para profundizar

- **Modelo conceptual:** `docs/ARCHITECTURE.md` (v3) + `docs/SYSTEM-DESIGN.md` (v2.0)
- **Roadmap táctico:** `docs/ROADMAP.md` (v2.0)
- **Modelo de datos:** `docs/DATA-MODEL.md` + `docs/POSTGRES.md`
- **Catálogo de módulos:** `docs/MODULE-CATALOG.md`
- **Vocabulario:** `docs/GLOSSARY.md` (canónico)
- **Decisiones técnicas:** `docs/DECISIONS.md` + `docs/adr/`
- **Operación en producción:** `docs/RUNBOOK.md`
- **Seguridad:** `docs/SECURITY.md`
- **Performance:** `docs/PERFORMANCE.md`
- **Auditorías:** `docs/audits/`
- **Entry point para nuevos:** `docs/00-START-HERE.md`
