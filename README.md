# Hindu Club Fútbol — Plataforma SaaS Modular Vertical

**Plataforma multi-tenant** para clubes deportivos, asociaciones civiles y entidades con gestión de socios, cuotas, eventos y CRM integrado. Primer cliente productivo: **Hindu Club Fútbol** (Buenos Aires, 2.390 socios activos).

[![Deploy Status](https://img.shields.io/badge/deploy-production-green)](https://hindu-club.vercel.app)
[![Tag](https://img.shields.io/badge/tag-v0.30.24.1-blue)](https://github.com/yamiro12/hindu-club-futbol/tags)
[![License](https://img.shields.io/badge/license-Proprietary-red)](#licencia)

---

## Qué es esto

Este repositorio contiene el código de producción de un **SaaS Modular Vertical (SMV)** desarrollado por Servicios cLevel SRL. La arquitectura permite empaquetar el mismo motor en distintas **verticales** (Bundles), cada una con un set de módulos propio.

**Bundle activo:** `ClubCore` — gestión integral de clubes deportivos.

**Cliente productivo:** `Hindu Club Fútbol` — primer despliegue real con datos vivos.

### Propuesta de valor

| Para clubes / asociaciones | Para verticales nuevas (próximo) |
|---|---|
| Gestión de socios, cuotas, eventos, contabilidad en un solo lugar | Mismo motor base + módulos verticales específicos |
| Multi-tenant nativo: una instancia, múltiples organizaciones | Onboarding de tenants en horas, no semanas |
| Portal del Cliente (auto-gestión socio) + Back Office (gestión interna) | RLS + auditoría + multi-rol de fábrica |
| Stack Next.js + Supabase: mantenible, escalable, costo bajo | API-first, expuesto a integraciones |

---

## Arquitectura en 1 párrafo

Next.js 14 (App Router, RSC) + TypeScript estricto en el frontend. Supabase (Postgres 15 + Row Level Security + Edge Functions + Auth) como backend completo. Vercel para deploy continuo + Edge Functions de Next. El código fuente está organizado en `modules/` (37 módulos productivos sobre 91 catalogados), con `app/` orquestando rutas tanto del Back Office (BO) como del Portal del Cliente (PC). Multi-tenancy se implementa a nivel BD vía claim `tenant_id` propagado en RLS policies. Métricas actuales: 169 tablas, 355 políticas RLS, 126 funciones SQL, 97 triggers, ~128.764 LOC, 834 archivos.

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Cliente final / Operador interno)                     │
└─────────────────┬───────────────────────────┬───────────────────┘
                  │                           │
       ┌──────────▼──────────┐   ┌────────────▼──────────┐
       │  Portal del Cliente  │   │   Back Office (BO)    │
       │  (auto-gestión socio)│   │ (operadores internos) │
       └──────────┬──────────┘   └────────────┬──────────┘
                  │                           │
                  └─────────────┬─────────────┘
                                │
                  ┌─────────────▼─────────────┐
                  │   Next.js 14 (Vercel)     │
                  │   App Router + RSC + TS   │
                  └─────────────┬─────────────┘
                                │
                  ┌─────────────▼─────────────┐
                  │   Supabase (Postgres 15)  │
                  │   RLS + Edge Fn + Auth    │
                  └───────────────────────────┘
```

---

## Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Lenguaje | TypeScript | 5.x |
| Framework | Next.js | 14 (App Router) |
| UI | React | 18 |
| Estilos | Tailwind CSS + shadcn/ui | 3.x / 4.x |
| Backend | Supabase | Postgres 15 + Auth + RLS |
| Deploy | Vercel | Edge + Serverless |
| Tests E2E | Playwright | 1.x |
| Tests unit | Vitest | 1.x |
| Package manager | pnpm | 9.x |
| CI | GitHub Actions | — |

---

## Cómo correr en local

### Requisitos previos

- Node.js ≥ 20
- pnpm ≥ 9
- Cuenta de Supabase con proyecto configurado
- Variables de entorno (ver `.env.example`)

### Instalación

```bash
# Clonar
git clone https://github.com/yamiro12/hindu-club-futbol.git
cd hindu-club-futbol

# Instalar dependencias
pnpm install

# Configurar entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Levantar dev server
pnpm dev
```

Abrir `http://localhost:3000`.

### Variables de entorno necesarias

Ver `.env.example`. Mínimo requerido:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Cómo testear

```bash
# Unit tests (Vitest)
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# Typecheck
pnpm typecheck

# Lint
pnpm lint

# Build (producción)
pnpm build
```

CI corre en cada push a `main` y en cada PR: lint + typecheck + build + unit tests. Ver `.github/workflows/ci.yml`.

---

## Estructura del repositorio

```
hindu-v2/
├── app/                  # App Router (rutas BO + Portal Cliente)
├── components/           # Componentes UI compartidos
├── modules/              # 37 módulos verticales (catálogo de 91)
├── lib/                  # Utilidades, clientes Supabase, helpers
├── styles/               # CSS global + tokens
├── public/               # Assets estáticos
├── tests/                # Tests E2E (Playwright) + unit (Vitest)
├── supabase/             # Migraciones + Edge Functions
├── eslint-rules/         # Reglas custom ESLint
├── scripts/              # Scripts de mantenimiento
├── docs/                 # Documentación canónica (ver abajo)
├── CLAUDE.md             # Contexto operativo para IA (sprints)
└── README.md             # Este archivo
```

### Documentación canónica

Para entender qué está hecho, qué falta y cómo se decidió, leer en este orden:

1. **`docs/00-START-HERE.md`** — entry point único para humanos. 4 rutas de lectura según rol.
2. **`docs/MASTER-PROJECT.md`** — modelo conceptual completo (SMV / Bundles / Verticales).
3. **`docs/CURRENT-STATE.md`** — estado actual del producto (métricas, qué funciona, qué falta).
4. **`docs/SPRINT-PLAN.md`** — roadmap estratégico (13 tramos T1-T13, fases A/B/C/D).
5. **`docs/DATA-MODEL.md`** — modelo de datos (169 tablas en capas).
6. **`docs/MODULE-CATALOG.md`** — catálogo de los 91 módulos (37 implementados).
7. **`docs/adr/`** — Architecture Decision Records (decisiones técnicas vinculantes).
8. **`docs/rfcs/`** — RFCs (propuestas de cambio mayores).
9. **`docs/audits/`** — auditorías arquitectónicas y de calidad.
10. **`docs/sprints/`** — historial de sprints A1-A6 y B-series.
11. **`docs/cierres/`** — cierres ejecutivos de fases.

---

## Estado actual del producto

**Tag actual:** `v0.30.24.1-docs-reorg`  
**Próximo sprint:** `B18` — Sidebar Back Office universal (7 espacios cross-vertical)  
**Fase actual:** B (Backend Multi-tenant + UI Operativa) — 90% completa  
**Cliente productivo:** Hindu Club Fútbol — 2.390 socios cargados, en validación post-FASE 15  
**URL producción:** https://hindu-club.vercel.app  

Para detalle completo, ver `docs/CURRENT-STATE.md`.

---

## Equipo y contacto

| Rol | Persona |
|---|---|
| CEO / Product Owner | Yair Ricardo Levy Wald — Servicios cLevel SRL |
| Owner técnico (arquitecto) | Claude Opus 4.x (Chat Agencia FC) |
| Owner ejecutor (código) | Claude Code (sesiones por sprint) |
| Legal | Kate Feldman (CPACF) |

**Contacto:** yair@levywald.com

---

## Licencia

Software propietario de **Servicios cLevel SRL** (en formación, CUIT en trámite IGJ). Todos los derechos reservados. El uso, distribución, copia o modificación requiere autorización escrita del propietario.

Ningún código de este repositorio constituye software libre, open source o de dominio público, salvo dependencias de terceros listadas en `package.json` (cada una bajo su licencia original).

---

## Notas para inversores / due diligence técnica

- **Arquitectura multi-tenant nativa:** RLS de Postgres aplicado en 355 políticas sobre 169 tablas. No hay "single-tenant retrocompatible". Multi-tenancy es el default.
- **Score arquitectónico interno:** 7.8/10 (auditoría 26-may-2026). Deuda técnica clasificada en 4 tiers con plan de remediación documentado en `docs/audits/`.
- **TypeScript estricto:** Errores actuales (541) clasificados: 47% falsos positivos por configuración + 53% triviales. 0% errores de lógica. Fix mecánico estimado: 10h.
- **RLS coverage:** 34/34 tablas en schema `public` con RLS habilitado en repo FC paralelo. En este repo (KA/ClubCore), 10 tablas pendientes de RLS — Tier 1 deuda técnica.
- **Tests:** 137 unit tests passing + suite E2E Playwright. 1 suite con alias `@/` roto (preexistente, no bloqueante).
- **Deploy:** automático via Vercel en cada push a `main`. Última URL productiva verificada: https://hindu-club.vercel.app

Para auditoría completa, leer `docs/audits/AUDIT-ARQUITECTONICA-2026-05-26.md`.
