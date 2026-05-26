# Hindu Club Fútbol — Plataforma SaaS Multimodal

**Plataforma multi-tenant** multi-vertical para gestionar personas, finanzas, comunicaciones, operaciones y más, sobre una base común extensible por módulos. Primer vertical productivo: **CCBP** (Clubes, Countries y Barrios Privados). Primer cliente productivo: **Hindu Club Fútbol** (Buenos Aires, 2.390 socios activos).

[![Deploy Status](https://img.shields.io/badge/deploy-production-green)](https://hindu-club.vercel.app)
[![Tag](https://img.shields.io/badge/tag-v0.30.24.2-blue)](https://github.com/yamiro12/hindu-club-futbol/tags)
[![License](https://img.shields.io/badge/license-Proprietary-red)](#licencia)

---

## Qué es esto

Este repositorio contiene el código de producción de la **Plataforma SaaS Multimodal**, desarrollada por Servicios cLevel SRL. La plataforma se organiza en **4 capas** (definidas en ADR-031):

- **Capa 0 — Troncal:** base universal (CRM, ERP, PIM, Plataforma). Sirve a cualquier organización, no solo clubes. Obligatoria, siempre activa.
- **Capa 1 — Módulos:** capacidades componibles, activables por tenant. Todos al mismo nivel jerárquico. Cada módulo declara su contrato en `module.json`. **18 módulos built-in**, portables y reemplazables por adapters externos.
- **Capa 2 — Verticales:** presets de combinación de módulos por sector. No es código: es configuración. Vertical activa: CCBP. Catalogadas: Arq, Abog, Pub, Retail.
- **Capa 3 — Conectores:** integraciones con servicios externos (Resend, MercadoPago, WhatsApp, etc).

**Vertical activo:** `CCBP` — gestión integral de Clubes, Countries y Barrios Privados.  
**Cliente productivo:** `Hindu Club Fútbol` — primer despliegue real con datos vivos.

### Propuesta de valor

| Para clubes / countries / barrios | Para verticales nuevas (próximo) |
|---|---|
| Gestión de socios, cuotas, eventos, contabilidad en un solo lugar | Mismo Troncal + módulos reusables + preset específico |
| Multi-tenant nativo: una instancia, múltiples organizaciones | Onboarding de tenants en horas, no semanas |
| Portal del Cliente (auto-gestión socio) + Back Office (gestión interna) | RLS + auditoría + multi-rol de fábrica |
| Mobile-first real para Android baja gama (4GB RAM, 4G inestable AR) | API-first, expuesto a integraciones via Capa 3 Conectores |

---

## Arquitectura en 1 párrafo

Next.js 15 (App Router, RSC) + React 19 + Tailwind 4 + shadcn v4 sobre base-ui en el frontend. Supabase (Postgres 15 + Row Level Security + Auth + Storage + Edge Functions) como backend completo. Vercel para deploy continuo. Multi-tenancy a nivel BD vía claim `tenant_id` propagado en RLS policies. Cada módulo es portable (declara su contrato en `module.json`) y puede ser reemplazado por un adapter externo. El **hardware target es Android baja gama con 4G inestable argentino**: cada decisión técnica se mide contra ese contexto, no contra una MacBook Pro en fibra.

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (Cliente final / Operador interno)                     │
│  Target: Android baja gama, 4G inestable AR                     │
└─────────────────┬───────────────────────────┬───────────────────┘
                  │                           │
       ┌──────────▼──────────┐   ┌────────────▼──────────┐
       │  Portal del Cliente │   │   Back Office (BO)    │
       │  (auto-gestión)     │   │ (operadores internos) │
       └──────────┬──────────┘   └────────────┬──────────┘
                  │                           │
                  └─────────────┬─────────────┘
                                │
                  ┌─────────────▼─────────────────────────┐
                  │  Next.js 15 (Vercel)                  │
                  │  App Router + RSC + React 19 + TS     │
                  └─────────────┬─────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
       ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
       │  Supabase   │   │ Conectores  │   │  Webhooks   │
       │  Postgres   │   │ (Resend,    │   │  salientes  │
       │  + RLS +    │   │  MercadoPago│   │             │
       │  Auth +     │   │  WhatsApp — │   │             │
       │  Storage    │   │  todos mock │   │             │
       └─────────────┘   └─────────────┘   └─────────────┘
```

Para el modelo conceptual completo, ver `docs/ARCHITECTURE.md` (canónico v3) y `docs/SYSTEM-DESIGN.md` (v2.0 post RFC-004).

---

## Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Lenguaje | TypeScript | 5.x estricto |
| Framework | Next.js | **15** (App Router + RSC) |
| UI runtime | React | **19** |
| Estilos | Tailwind CSS | **4** |
| Componentes | shadcn/ui sobre base-ui (NO Radix) | **v4** |
| Backend | Supabase | Postgres 15 + Auth + RLS + Storage + Edge Fn |
| Email | Resend | Mock hasta FASE 16 |
| Pagos | MercadoPago | Mock hasta FASE 16 |
| Mensajería | WhatsApp Business | Mock |
| Crons | Vercel Cron | — |
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

CI corre en cada push a `main` y en cada PR: lint + typecheck + build + unit tests. Setup E2E completo en `docs/E2E-TESTING.md`.

---

## Estructura del repositorio

```
hindu-club-futbol/
├── app/                  # App Router (rutas BO + Portal Cliente)
├── components/           # Componentes UI compartidos
├── modules/              # Módulos físicos (Capa 1)
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

Para entender qué es, cómo opera y por qué se decidió así, leer en este orden:

1. **`docs/00-START-HERE.md`** — entry point único. 4 rutas de lectura según rol.
2. **`docs/ARCHITECTURE.md`** — canónico v3 (Sprint H4).
3. **`docs/SYSTEM-DESIGN.md`** — diseño de sistema v2.0 (post RFC-004).
4. **`docs/ROADMAP.md`** — roadmap v2.0 (17 fases por dependencias).
5. **`docs/GLOSSARY.md`** — vocabulario canónico. **Cuando hay ambigüedad, este documento gana.**
6. **`docs/MODULE-CATALOG.md`** — catálogo de módulos físicos.
7. **`docs/DATA-MODEL.md`** — modelo de datos por familia.
8. **`docs/POSTGRES.md`** — schema SQL, funciones, RLS, migraciones.
9. **`docs/SECURITY.md`** — políticas y controles de seguridad.
10. **`docs/PERFORMANCE.md`** — objetivos y restricciones para Android baja gama.
11. **`docs/UI-UX.md`** + **`docs/UI-UX-PATTERNS.md`** — estándares de interfaz.
12. **`docs/DESIGN-SYSTEM.md`** — tokens, componentes base, iconografía.
13. **`docs/BRAND-PLATFORM.md`** — marca del producto raíz.
14. **`docs/RUNBOOK.md`** — manual operativo en producción.
15. **`docs/API.md`** — API REST v1.
16. **`docs/E2E-TESTING.md`** — setup de tests E2E.
17. **`docs/SYSTEM-PROMPTS.md`** — specs formales de agentes IA del sistema.
18. **`docs/VISUAL-GALLERY.md`** — índice de capturas visuales por sprint.
19. **`docs/MENORES-TUTORES.md`** — spec de negocio (menores + tutores).
20. **`docs/CURRENT-STATE.md`** — estado actual concreto.
21. **`docs/DECISIONS.md` + `docs/adr/`** — Architecture Decision Records.
22. **`docs/rfcs/`** — RFCs (cambios mayores).
23. **`docs/audits/`** — auditorías arquitectónicas y de calidad.
24. **`docs/sprints/`** — historial de sprints.
25. **`docs/cierres/`** — cierres ejecutivos de fases.

---

## Estado actual del producto

**Tag actual:** `v0.30.24.2-docs-sync`  
**Próximo sprint:** `B18` — Sidebar Back Office universal (7 espacios cross-vertical)  
**Roadmap:** 17 fases ordenadas por dependencias (no por calendario). Según `ROADMAP.md`, Fases A y B completas. Próxima: Fase 6 (Portal Cliente Completo).  
**Cliente productivo:** Hindu Club Fútbol — 2.390 socios cargados, en validación post-FASE 15  
**URL producción:** https://hindu-club.vercel.app  

Para detalle completo, ver `docs/CURRENT-STATE.md` y `docs/ROADMAP.md`.

---

## Equipo y contacto

| Rol | Persona |
|---|---|
| CEO / Product Owner | Yair Ricardo Levy Wald — Servicios cLevel SRL |
| Owner técnico (arquitecto) | Claude Opus 4.x |
| Owner ejecutor (código) | Claude Code (sesiones por sprint) |
| Legal | Kate Feldman (CPACF) |

**Contacto:** yair@levywald.com

---

## Licencia

Software propietario de **Servicios cLevel SRL** (en formación, CUIT en trámite IGJ). Todos los derechos reservados. El uso, distribución, copia o modificación requiere autorización escrita del propietario.

Ningún código de este repositorio constituye software libre, open source o de dominio público, salvo dependencias de terceros listadas en `package.json` (cada una bajo su licencia original).

---

## Notas para inversores / due diligence técnica

- **Arquitectura multi-tenant nativa:** RLS de Postgres en 140+ tablas. Multi-tenancy default desde el primer commit, no retrofit.
- **Modelo modular real:** 4 capas (Troncal / Módulos / Verticales / Conectores) definidas en `ADR-031`. Cada módulo declara su contrato en `module.json` y es reemplazable por adapter externo.
- **Vertical productiva validada:** CCBP corriendo con Hindu Club (2.390 socios reales). Próximas verticales catalogadas: Arq, Abog, Pub, Retail.
- **Score arquitectónico interno:** 7.8/10 (auditoría 26-may-2026). Deuda técnica clasificada en 4 tiers con plan de remediación en `docs/audits/`.
- **Hardware target explícito:** Android baja gama (4GB RAM, 4G inestable AR). Performance es feature, no optimización post-mortem. Detalle en `docs/PERFORMANCE.md`.
- **Tests:** 137 unit tests passing + suite E2E Playwright. Setup detallado en `docs/E2E-TESTING.md`.
- **Deploy:** automático via Vercel en cada push a `main`. Última URL productiva verificada: https://hindu-club.vercel.app

Para auditoría completa, leer `docs/audits/AUDIT-ARQUITECTONICA-2026-05-26.md`.
