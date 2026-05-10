# PARTE 1 — Estructura y documentación existente

## 1.1 Árbol de carpetas (3 niveles)

```
hindu-v2/
├── app/
│   ├── (public)/                    # Páginas públicas (sin auth)
│   │   ├── _components/
│   │   ├── _lib/
│   │   ├── asociate/
│   │   ├── equipos/
│   │   ├── login/
│   │   ├── privacidad/
│   │   ├── terminos/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── admin/                       # Panel admin (requiere auth)
│   │   ├── cajas/                   # Redirect → finanzas/cajas
│   │   ├── comunicaciones/
│   │   ├── configuracion/
│   │   ├── equipos/
│   │   ├── externos/
│   │   ├── finanzas/
│   │   ├── integraciones/
│   │   ├── mi-cuenta/
│   │   ├── mi-equipo/
│   │   ├── mi-perfil/
│   │   ├── notificaciones/
│   │   ├── operaciones/
│   │   ├── padrones/
│   │   ├── personas/
│   │   ├── pre-inscripciones/
│   │   ├── rrhh/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── asistencias/
│   │   ├── auth/
│   │   ├── cron/
│   │   ├── notificaciones/
│   │   ├── operaciones/
│   │   └── v1/
│   ├── globals.css
│   ├── layout.tsx
│   └── favicon.ico
├── components/
│   ├── auth/                        # login-form, magic-link-form
│   ├── layout/                      # sidebar, topbar, global-search, mobile-nav, theme-toggle, notificaciones-dropdown
│   └── ui/                          # shadcn components + custom (vistas-panel, selection-bar, export-format-selector, etc.)
├── lib/
│   ├── api/                         # auth.ts, helpers.ts, scopes.ts
│   ├── comunicaciones/              # email.ts, notificar.ts
│   ├── export/                      # formats.ts, template.ts
│   ├── imports/                     # actions.ts, parsers/
│   ├── padron-sync/                 # parsers.ts, processor.ts (legacy)
│   ├── search/                      # global-search.ts
│   ├── supabase/                    # client.ts, server.ts, middleware.ts
│   ├── vinculos/                    # labels.ts
│   ├── vistas/                      # actions.ts, column-defs.ts
│   ├── tenant.ts
│   └── utils.ts
├── supabase/
│   ├── migrations/                  # 36 archivos SQL
│   ├── .temp/
│   └── seed.sql
├── docs/                            # 11 archivos de documentación
├── public/                          # hindu-logo.png
├── CLAUDE.md
├── MASTER-GAPS.md
├── NEXT-SPRINT.md
├── README.md
├── middleware.ts
├── next.config.ts
├── package.json
├── tsconfig.json
├── vercel.json
├── eslint.config.mjs
└── postcss.config.mjs
```

## 1.2 Archivos .md del repo

### Archivos raíz (críticos)

| Path | Propósito | Última mod. | Estado |
|------|-----------|-------------|--------|
| `CLAUDE.md` | Instrucciones para agentes IA, reglas, convenciones, stack | 2026-05-06 | Vigente pero desactualizado (tabla de sprints dice 11.5=PROXIMO cuando ya estamos en 14c.2) |
| `MASTER-GAPS.md` | Roadmap completo + estado + decisiones técnicas | 2026-05-08 | Parcialmente desactualizado (no refleja Sprint 14c.0-14c.2) |
| `NEXT-SPRINT.md` | Qué hacer ahora — apunta a Sprint 14 (Mantenimiento) | 2026-05-07 | Desactualizado (el Sprint 14 real fue importadores, no mantenimiento) |
| `README.md` | Para humanos, setup local, estructura, stack | 2026-05-06 | Parcialmente desactualizado (tabla de sprints, stats DB) |

### Archivos docs/

| Path | Propósito | Última mod. | Estado |
|------|-----------|-------------|--------|
| `docs/PROPUESTA-ARQUITECTONICA.md` | 13 decisiones arquitectónicas firmes (D1-D13) | 2026-05-06 | Vigente |
| `docs/ARCHITECTURE.md` | Separación de capas, patrón de módulo, multi-tenant | 2026-05-06 | Vigente |
| `docs/API.md` | Documentación API REST v1 (5 endpoints) | 2026-05-07 | Vigente |
| `docs/UI-UX.md` | Responsive, patrones React, shadcn v4, uploads, exports | 2026-05-06 | Vigente |
| `docs/DESIGN-SYSTEM.md` | Colores, tipografía, componentes panel admin | 2026-05-06 | Vigente |
| `docs/BRAND-DESIGN-SYSTEM.md` | Brand colors Hindu, público, dark mode, SEO, storage | 2026-05-06 | Vigente |
| `docs/POSTGRES.md` | Índices, RLS, migraciones seguras, funciones SQL | 2026-05-06 | Vigente (lista de migrations incompleta) |
| `docs/WORKFLOW.md` | Checklists pre/post desarrollo, ABM docs | 2026-05-06 | Vigente |
| `docs/SKILL-CHALLENGE.md` | Pre-mortem /challenge para planes complejos | 2026-05-05 | Vigente |
| `docs/REPORTE-CLEANUP-POST-SPRINT11.md` | Cleanup seguridad DB post-Sprint 11 | 2026-05-06 | Vigente (snapshot histórico) |
| `docs/MENORES-TUTORES.md` | Spec de negocio menores + tutores | 2026-05-05 | Vigente (spec futura, no implementado) |

### Contenido completo de archivos críticos

Los contenidos de README.md, MASTER-GAPS.md, NEXT-SPRINT.md y CLAUDE.md son extensos.
El orquestador ya tiene acceso a CLAUDE.md (se carga en cada sesión).
MASTER-GAPS.md y NEXT-SPRINT.md se incluyen completos en AUDIT-9-historial-sprints.md.

## 1.3 Convenciones documentadas

Las convenciones están documentadas en CLAUDE.md y docs/PROPUESTA-ARQUITECTONICA.md. Resumen:

### Naming
- Tablas: `snake_case_plural` — Columnas: `snake_case_singular`
- FK: `nombre_tabla_id` — Slugs FK: `_slug` — Timestamps: `_at` — Dates: `fecha_*`
- Booleans: `es_*` — URLs: `_url` — Extensibilidad: `metadata jsonb`
- Prefijos por módulo: `fin_*`, `rrhh_*`, `ops_*`, `com_*`, `mant_*`, `res_*`, `shop_*`, `inv_*`, `map_*`

### Idioma
- DB y código: español argentino
- UI: español rioplatense (tuteo)
- Conceptos técnicos (handlers, params, hooks): inglés

### Patrón de módulo
```
app/admin/{modulo}/
├── page.tsx              # Server Component — lista
├── [id]/page.tsx          # Server Component — detalle
├── _lib/queries.ts        # Funciones de lectura
├── _actions.ts            # Server actions (mutations)
└── _components/           # Componentes del módulo
```

### Stack obligatorio
- Next.js 16 App Router, TypeScript strict, Tailwind 4, shadcn/ui v4
- Supabase (Postgres + Auth + Storage), pnpm, Vercel
- shadcn v4: `render` prop (NO `asChild`), Select `onValueChange` devuelve `string | null`
