# MASTER PROJECT — Modelo Conceptual del SaaS Modular Vertical (SMV)

**Última actualización:** 26-may-2026  
**Reemplaza:** `MASTER-MODEL-CCBP.md` (rename + actualización con métricas reales).

Este documento describe **el modelo conceptual completo** del producto. Si querés entender qué es esto, cómo se descompone, y por qué la arquitectura es la que es, **leé este archivo entero**. Lectura estimada: 30 min.

---

## 1. Visión

**SaaS Modular Vertical (SMV)** es un patrón de producto donde:

- **Un motor base** (auth + tenancy + RLS + auditoría + UI shell) se reutiliza en N **Bundles verticales**.
- Cada **Bundle** es un set específico de **módulos** para una vertical determinada (clubes deportivos, asociaciones civiles, cooperativas, escuelas, etc.).
- Cada **cliente** se onboardea en horas (no semanas) porque el Bundle ya trae los módulos pre-configurados.

```
                    ┌──────────────────┐
                    │  Motor Base SMV  │
                    │  (multi-tenant)  │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼─────┐         ┌────▼─────┐         ┌────▼─────┐
   │ ClubCore │         │ AsocCore │         │ EscuCore │
   │ (act.)   │         │ (próximo)│         │ (futuro) │
   └────┬─────┘         └──────────┘         └──────────┘
        │
   ┌────▼──────────────────────┐
   │  Hindu Club (productivo)  │
   │  Tenants futuros: N       │
   └───────────────────────────┘
```

**Diferencia clave vs. SaaS tradicional:**

| SaaS tradicional | SMV |
|---|---|
| Un producto, N clientes en la misma vertical | Un motor, N verticales, N clientes por vertical |
| Cambiar de vertical = nuevo producto | Cambiar de vertical = nuevo Bundle (semanas) |
| Onboarding lento (semanas a meses) | Onboarding rápido (horas a días) |
| Costos altos por marketing por vertical | Costos amortizados entre verticales |

---

## 2. Capas del modelo

El producto tiene **4 capas** apiladas:

```
┌─────────────────────────────────────────┐
│  Cliente / Tenant (ej: Hindu Club)      │  ← capa 4: instancia concreta
├─────────────────────────────────────────┤
│  Bundle (ej: ClubCore)                  │  ← capa 3: vertical empaquetada
├─────────────────────────────────────────┤
│  Motor SMV (multi-tenant + RLS + UI)    │  ← capa 2: producto base
├─────────────────────────────────────────┤
│  Stack técnico (Next.js + Supabase)     │  ← capa 1: infraestructura
└─────────────────────────────────────────┘
```

### Capa 1 — Stack técnico

- **Frontend:** Next.js 14, React 18, TypeScript estricto, Tailwind CSS, shadcn/ui.
- **Backend:** Supabase (Postgres 15, RLS, Auth, Edge Functions).
- **Deploy:** Vercel (Edge + Serverless).
- **CI/CD:** GitHub Actions + Vercel preview deploys.
- **Tests:** Playwright (E2E) + Vitest (unit).

### Capa 2 — Motor SMV

Componentes transversales **comunes a todas las verticales**:

| Componente | Qué hace |
|---|---|
| **Auth** | Login, recovery, MFA, sesiones — Supabase Auth |
| **Tenancy** | Multi-tenant via `tenant_id` propagado en RLS |
| **RLS** | 355 políticas que aíslan datos por tenant |
| **Audit** | Trail inmutable de operaciones críticas |
| **UI Shell** | Sidebar BO universal (7 espacios) + layout PC |
| **Roles** | Sistema de roles + permisos multi-tenant |
| **i18n** | Español rioplatense por default, extensible |
| **Notifications** | Email (Resend, pendiente) + in-app |

### Capa 3 — Bundle (vertical específica)

Actualmente activo: **ClubCore**.

Un Bundle define:

- Qué **módulos** del catálogo se incluyen.
- Qué **roles** son válidos en esta vertical.
- Qué **flujos onboarding** se ejecutan para tenants nuevos.
- Qué **dashboards** y **reports** son default.
- Qué **terminología** se usa en UI (ej: "socios" vs "afiliados" vs "miembros").

### Capa 4 — Cliente / Tenant

Una instancia concreta del Bundle. Para ClubCore:

- **Hindu Club Fútbol** — productivo, 2.390 socios cargados.
- **Tenants futuros:** otros clubes deportivos (post-Hindu validado).

---

## 3. Bundles activos y planeados

| Bundle | Estado | Cliente piloto | Notas |
|---|---|---|---|
| **ClubCore** | 🟢 Activo (37/91 módulos) | Hindu Club Fútbol | Primera vertical, primer cliente productivo |
| **AsocCore** | 🟡 Catalogado, no construido | TBD | Asociaciones civiles — reutiliza ~80% módulos ClubCore |
| **EscuCore** | ⚪ Idea | TBD | Escuelas / educación |
| **CoopCore** | ⚪ Idea | TBD | Cooperativas |

---

## 4. Módulos: el corazón del catálogo

Un **módulo** es una unidad funcional autónoma con:

- Su tabla(s) Supabase con RLS.
- Su UI (rutas en `app/`, componentes en `components/`).
- Su lógica de negocio en `modules/<modulo>/`.
- Sus tests E2E + unit.
- Su entrada en `MODULE-CATALOG.md`.

**Catálogo:** 91 módulos definidos. **Implementados:** 37.

### Categorías de módulos (ejemplos)

| Categoría | Módulos productivos | Ejemplos |
|---|---|---|
| **Personas** | 5 | Socios, contactos, dependientes, autorizados |
| **Cuotas y cobranza** | 4 | Cuotas, descuentos, recargos, cobros |
| **Eventos** | 3 | Calendario, inscripciones, asistencia |
| **Comunicación** | 2 | Notificaciones, comunicados |
| **Contabilidad** | 4 | Plan de cuentas, asientos, balances |
| **Reportes** | 3 | Listas, exportaciones, dashboards |
| **Administración** | 6 | Usuarios, roles, configuración, tenant settings |
| **Auditoría** | 2 | Log inmutable, reportes de cambios |
| **Onboarding** | 8 | Wizards de creación tenant + carga inicial |

Detalle completo: `MODULE-CATALOG.md`.

---

## 5. Arquitectura multi-tenant

### Estrategia de aislamiento

**Aislamiento por RLS en columna `tenant_id`.**

- Cada tabla productiva tiene columna `tenant_id NOT NULL`.
- Cada query desde la app inyecta `tenant_id` implícitamente via claim JWT.
- RLS policy filtra: `tenant_id = auth.jwt() ->> 'tenant_id'`.

**Ventajas:**

- Un solo schema Postgres → costos mínimos.
- Sin overhead operativo de N bases de datos.
- Migraciones aplican a todos los tenants automáticamente.

**Desventajas:**

- Una RLS mal escrita = leak entre tenants. Por eso 355 políticas con tests + auditoría.
- Tenant gigantesco puede afectar performance de otros. Se mitiga con índices + connection pooling.

### Layout BO vs PC

**Back Office (BO):** operadores internos del club gestionan socios, cuotas, eventos, contabilidad.

- Rutas: `app/(bo)/...`
- Sidebar universal de 7 espacios (ADR-039):
  1. Inicio
  2. Personas
  3. Operaciones
  4. Comunicación
  5. Reportes
  6. Configuración
  7. Auditoría

**Portal del Cliente (PC):** socio se auto-gestiona (paga cuotas, ve estado, inscribe a eventos).

- Rutas: `app/(pc)/...`
- Layout mobile-first.
- Acceso restringido a datos propios via RLS.

---

## 6. Fases del proyecto

El roadmap se divide en 4 fases:

| Fase | Nombre | Estado | Sprints |
|---|---|---|---|
| **A** | MVP funcional + datos reales | ✅ Cerrada | A1-A6 |
| **B** | Backend multi-tenant + UI operativa | 🟡 90% | B0-B18 |
| **C** | Portal Cliente Completo | ⚪ Pendiente | C0-C5 |
| **D** | Operación + documentación + ventas | ⚪ Pendiente | D1-D... |

### Fase A — MVP funcional (✅ cerrada)

- Schema Postgres inicial.
- Carga de datos de Hindu (2.390 socios).
- Auth básico.
- UI primera versión.

### Fase B — Backend multi-tenant + UI operativa (🟡 actual, 90%)

- Multi-tenancy con RLS sobre 169 tablas.
- 355 RLS policies.
- 37 módulos productivos sobre 91 catalogados.
- Sidebar BO refactor a 7 espacios universales (**próximo sprint: B18**).

### Fase C — Portal Cliente Completo (⚪ próxima)

- C0 — Portal Cliente Completo (40-56h en 8 sub-sprints).
- C1-C5 — flujos específicos: pagos, eventos, comunicación, perfil.

### Fase D — Operación + ventas (⚪ futura)

- Documentación operativa profunda.
- Onboarding self-service para tenants nuevos.
- Marketing site (separado de este repo).
- Sales playbook.

Detalle: `SPRINT-PLAN.md`.

---

## 7. Decisiones arquitectónicas clave

Ver `DECISIONS.md` (consolidado ADR-001 a ADR-046) y `adr/` (individuales 047+). Algunas decisiones-pilar:

| ADR | Decisión |
|---|---|
| ADR-005 | Multi-tenancy via RLS Postgres, no schema-per-tenant |
| ADR-012 | Next.js App Router (no Pages Router) |
| ADR-019 | Supabase como backend completo (no separar auth) |
| ADR-035 | Mock-first universal (no smoke tests contra producción Hindu) |
| ADR-039 | Sidebar BO Universal — 7 espacios cross-vertical |
| ADR-042 (FORMAL) | Nav Universal arquitectura definitiva |
| ADR-048 | Sistema de roles + permisos multi-tenant |
| ADR-058 | Migraciones SQL versionadas + reversibles |

---

## 8. Relación con el ecosistema SCL

Este proyecto es **uno de varios** dentro del holding **Servicios cLevel SRL (SCL)**:

```
                  ┌─────────────────────┐
                  │  Servicios cLevel   │
                  │   SRL (holding)     │
                  └──────────┬──────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
  ┌────▼────┐          ┌─────▼─────┐         ┌─────▼─────┐
  │   FC    │          │    KA     │         │   SMV     │  ← ESTE PROYECTO
  │Fractional│         │ Kontrol.ar│         │SaaS Mod.  │
  │ cLevel   │         │           │         │  Vertical │
  └─────────┘          └───────────┘         └───────────┘
   Services             SaaS general          SaaS modular
   (agencia)            (cualquier            (por vertical)
                        empresa)
```

- **FC (Fractional cLevel):** servicios de agencia. Prioritaria. No relacionada técnicamente con este repo.
- **KA (Kontrol.ar):** SaaS de gestión general. No relacionada técnicamente con este repo.
- **SMV (este proyecto):** SaaS modular vertical, primer cliente Hindu.

**Gobernanza:** "agencia manda" — FC tiene prioridad de recursos. SMV avanza en paralelo con velocidad menor pero constante.

---

## 9. Glosario rápido

| Término | Significado |
|---|---|
| **SMV** | SaaS Modular Vertical (este producto) |
| **Bundle** | Vertical empaquetada (ej: ClubCore) |
| **Vertical** | Sector económico al que apunta un Bundle |
| **Módulo** | Unidad funcional autónoma (37 implementados de 91 catalogados) |
| **Tenant** | Cliente con datos aislados via RLS |
| **BO** | Back Office (UI para operadores internos) |
| **PC** | Portal del Cliente (UI para usuarios finales) |
| **RLS** | Row Level Security de Postgres |
| **ADR** | Architecture Decision Record |
| **RFC** | Request for Comments (propuesta arquitectónica formal) |
| **FC** | Fractional cLevel (otra unidad de SCL) |
| **KA** | Kontrol.ar (otra unidad de SCL) |
| **SCL** | Servicios cLevel SRL (holding propietario) |
| **Hindu** | Hindu Club Fútbol (primer cliente productivo) |

---

## 10. Próximos hitos

| Hito | ETA aproximada | Bloqueantes |
|---|---|---|
| **Cerrar Fase B** | 1-2 meses | Sprint B18 (sidebar) + QA Round |
| **Iniciar Fase C** | post-B | Portal Cliente Completo (40-56h en 8 sub-sprints) |
| **Pre-launch Hindu producción real** | post-CUIT SCL | CUIT SCL en trámite IGJ |
| **Onboarding segundo tenant ClubCore** | post-Hindu validado | Hindu primero |
| **Bundle AsocCore (segunda vertical)** | post-segundo tenant | Modelo validado en producción |

---

**Para detalle táctico (qué se hace mañana):** `SPRINT-PLAN.md`.  
**Para estado actual (qué está hecho hoy):** `CURRENT-STATE.md`.  
**Para decisiones arquitectónicas:** `DECISIONS.md` + `adr/`.
