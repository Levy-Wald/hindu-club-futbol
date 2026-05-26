# CURRENT STATE — Estado actual del producto

**Última actualización:** 26-may-2026  
**Tag asociado:** `v0.30.24.1-docs-reorg`  
**Versión documento:** v3.2

Este documento describe **qué está hecho hoy, qué falta y qué está bloqueado**. Lectura estimada: 20 min.

---

## TL;DR

| Item | Estado |
|---|---|
| **Fase actual** | B (Backend Multi-tenant + UI Operativa) — 90% completa |
| **Último sprint cerrado** | Reorganización física de docs (PR #7) |
| **Próximo sprint** | B18 — Sidebar BO Universal 7 espacios |
| **Cliente productivo** | Hindu Club Fútbol (2.390 socios cargados) |
| **URL producción** | https://hindu-club.vercel.app |
| **Score arquitectónico** | 7.8/10 (auditoría 26-may-2026) |
| **Bloqueante crítico** | CUIT SCL en trámite IGJ (legal, no técnico) |

---

## Métricas técnicas (validadas 26-may-2026)

### Base de datos (Supabase)

| Métrica | Valor |
|---|---|
| Tablas totales | **169** |
| Tablas con RLS habilitado | 159 (10 pendientes — Tier 1 deuda) |
| Políticas RLS activas | **355** |
| Funciones SQL | **126** |
| Triggers | **97** |
| Migraciones SQL aplicadas | Varias (ver `supabase/migrations/`) |
| Edge Functions | Configuradas en `supabase/functions/` |

### Código

| Métrica | Valor |
|---|---|
| LOC totales | **~128.764** |
| Archivos | **834** |
| Módulos en `modules/` | **37** (productivos) sobre **91** catalogados |
| Errores TypeScript estricto | 541 (47% falsos positivos + 53% triviales + 0% lógica) |
| Tests unit passing | **137** |
| Tests E2E | Playwright (varios suites) |
| Test suite con alias roto | 1 (preexistente, no bloqueante) |

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

### Back Office (BO)

| Módulo | Status | Notas |
|---|---|---|
| **Auth + Login** | ✅ | Funcional, falta MFA |
| **Listado de personas** | ✅ | 2.390 socios cargados, búsqueda funcional |
| **Detalle de persona** | ✅ | Edición + historial |
| **Gestión de cuotas** | ✅ | Generación masiva + ajustes individuales |
| **Eventos básicos** | ✅ | Crear + listar |
| **Contabilidad básica** | 🟡 | Plan de cuentas + asientos manuales. Falta automatización. |
| **Reportes** | 🟡 | Listas básicas. Faltan dashboards. |
| **Usuarios y roles BO** | ✅ | Multi-rol funcional |
| **Configuración tenant** | 🟡 | Parcial. Falta wizard onboarding. |
| **Audit trail** | ✅ | Inmutable, accesible via SQL. Falta UI. |
| **Sidebar BO** | ⚠️ | Antiguo, será refactorizado en B18 a 7 espacios universales |

### Portal del Cliente (PC)

| Módulo | Status | Notas |
|---|---|---|
| **Login socio** | 🟡 | Parcial. Será completado en C0.2. |
| **Dashboard socio** | ⚪ | Pendiente (C0.3) |
| **Pago de cuotas** | ⚪ | Pendiente (C0.4) — bloqueado por MercadoPago + CUIT |
| **Inscripción a eventos** | ⚪ | Pendiente (C0.5) |
| **Perfil + dependientes** | ⚪ | Pendiente (C0.6) |
| **Notificaciones** | ⚪ | Pendiente (C0.7) |

### Multi-tenancy

- ✅ Schema unificado con `tenant_id` en todas las tablas productivas.
- ✅ 355 políticas RLS validadas.
- ⚠️ 10 tablas pendientes de habilitar RLS (Tier 1 deuda técnica, ~30 min fix).
- ✅ Auth JWT propaga `tenant_id` correctamente.
- ✅ Tests E2E validan aislamiento entre tenants demo.

---

## Qué falta (próximos 6-12 meses)

### Inmediato (Fase B cierre)

| Sprint | Descripción | ETA |
|---|---|---|
| **B18** | Sidebar BO Universal (7 espacios cross-vertical) | 1-2 semanas |
| **QA Round** | Validación cruzada post-B18 | +1 semana |

### Corto plazo (Fase C — Portal Cliente)

| Sub-sprint | Descripción | ETA acumulada |
|---|---|---|
| C0.1 | Layout PC mobile-first | +2 sem |
| C0.2 | Login + signup socio | +3 sem |
| C0.3 | Dashboard socio | +4 sem |
| C0.4 | Pago de cuotas | +5 sem (bloqueado MP) |
| C0.5 | Inscripción eventos | +6 sem |
| C0.6 | Perfil + dependientes | +7 sem |
| C0.7 | Notificaciones in-app | +8 sem |
| C0.8 | Recovery + flujos secundarios | +9 sem |

### Mediano plazo (Fase D — Operación + ventas)

- Onboarding self-service para tenants nuevos.
- Documentación operativa profunda.
- Marketing site institucional.
- Sales playbook.
- Segundo cliente ClubCore.
- Segunda vertical (AsocCore).

---

## Bloqueantes activos

| Bloqueante | Impacta | ETA fix |
|---|---|---|
| **CUIT SCL en trámite IGJ** | Pre-launch productivo, todo lo legal/fiscal | Depende IGJ |
| **Resend (transactional email)** | Confirmaciones, recovery password, comunicados | Setup post-CUIT |
| **MercadoPago integración** | C0.4 Pago de cuotas productivo | Setup post-CUIT |
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
| Fix 541 errores TS strict (mecánicos) | ~10h fix |

### Tier 2-4

- Refactor de patrones detectados (ver `audits/AUDIT-PATRONES-ARQUITECTONICOS-2026-05-26.md`).
- Mejoras de testing (ver `audits/AUDIT-TESTING-CODEHEALTH-2026-05-26.md`).

**Detalle completo:** `docs/audits/AUDIT-ARQUITECTONICA-2026-05-26.md`.

---

## Estado del repo (organización física)

### Raíz

```
app/  components/  lib/  modules/  styles/  public/
tests/  supabase/  scripts/  eslint-rules/
docs/  CLAUDE.md  README.md
package.json  tsconfig.json  next.config.ts  middleware.ts
playwright.config.ts  vercel.json  pnpm-lock.yaml
.gitignore  .env.example
```

### `docs/` (post-Paso 1 reorg)

```
docs/
├── 00-START-HERE.md         (próximo)
├── MASTER-PROJECT.md        (próximo)
├── CURRENT-STATE.md         (este archivo)
├── SPRINT-PLAN.md           (sincronizado v3.0)
├── DATA-MODEL.md            (sincronizado 169 tablas)
├── MODULE-CATALOG.md        (sincronizado 37/91)
├── DECISIONS.md             (ADR-001 a ADR-046)
├── adr/                     (ADR-047+ individuales)
├── rfcs/                    (RFC-001 a RFC-005)
├── audits/                  (4 auditorías 26-may)
├── cierres/                 (cierres ejecutivos fases)
├── sprints/                 (A1-A6 + B-series)
├── templates/               (RFC, post-mortem, prompt, E2E checklist, skill challenge)
├── pre-mortems/
├── navigation/              (especificación Nav Universal)
├── verticales/ccbp/         (docs específicos ClubCore)
└── archive/                 (histórico)
```

---

## Cambios recientes (últimos 30 días)

| Fecha | Cambio |
|---|---|
| 26-may | Reorganización física docs (PR #7) — tag `v0.30.24.1-docs-reorg` |
| 26-may | Auditoría arquitectónica completa — 4 docs en `audits/` |
| 22-may | B17 cierre — tag `v0.30.24-b17` |
| 21-may | ROADMAP post-B17 creado en Drive |
| 18-may | SPRINT-PLAN v3.0 + RFC-005 v2.0 (FUENTE DE VERDAD) |
| 14-may | Pre-mortem fase B17 |

---

## Drive del proyecto

**Raíz:** https://drive.google.com/drive/folders/1cZVm440-tL7qgCmqe6ONDu26qvyprj98

**Documentos vivos en raíz:**

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
- `_Roadmap/` (SPRINT-PLAN v3.0, post-B17, deuda técnica)
- `_Sprints/` (prompts de sprints)
- `_Verticales/`
- `_Archivo/`

---

## Persona / Contacto

| Rol | Persona |
|---|---|
| **CEO + Product Owner** | Yair Ricardo Levy Wald |
| **Arquitecto (IA)** | Claude Opus 4.x (Chat Agencia FC) |
| **Ejecutor código (IA)** | Claude Code (sesiones por sprint) |
| **Legal** | Kate Feldman (CPACF) |

**Email:** yair@levywald.com  
**Tel:** +54 9 11 5014 8932

---

## Para profundizar

- **Modelo conceptual:** `MASTER-PROJECT.md`
- **Roadmap táctico:** `SPRINT-PLAN.md`
- **Modelo de datos:** `DATA-MODEL.md`
- **Catálogo de módulos:** `MODULE-CATALOG.md`
- **Decisiones técnicas:** `DECISIONS.md` + `adr/`
- **Auditorías:** `audits/`
- **Entry point para nuevos:** `00-START-HERE.md`
