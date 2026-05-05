# ClubCore — Hindu Club Fútbol V2

Plataforma SaaS multi-tenant para gestión de clubes deportivos.
Cliente piloto: **Hindu Club Fútbol**.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Lenguaje:** TypeScript estricto
- **UI:** Tailwind 4 + shadcn/ui v4 (base-ui)
- **Base de datos:** Supabase (Postgres + Auth + Storage + RLS)
- **Deploy:** Vercel
- **Package manager:** pnpm

## Setup local

```bash
git clone https://github.com/yamiro12/hindu-club-futbol.git hindu-v2
cd hindu-v2
pnpm install
cp .env.example .env.local
# Completar las keys en .env.local (pedirlas a Yair)
pnpm dev
# Abrir http://localhost:3000
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (NO commitear) |

## Plan de 15 sprints hasta Hindu LIVE

| Sprint | Contenido | Estado |
|--------|-----------|--------|
| 1 | Foundation (migrations, auth, layout, RLS, deploy) | HECHO |
| 2 | ABM Personas + Vista Global | HECHO |
| 3 | Padrones + Importación masiva | HECHO |
| 4 | Equipos + Categorías + Horarios + Asignaciones | HECHO |
| 5 | Vínculos + Tutores/Padres + Bajas | HECHO |
| 6 | Entidades + Federaciones + Fusiones | HECHO |
| 7 | Mi Perfil + Mi Equipo (vista jugador) | PENDIENTE |
| 8 | Páginas públicas + Branding + Pre-inscripción | PENDIENTE |
| 9 | Cajas + Movimientos + Productos | PENDIENTE |
| 10 | Operaciones deportivas avanzadas | PENDIENTE |
| 11 | Empleados + Contratos + Liquidaciones | PENDIENTE |
| 12 | Comunicaciones | PENDIENTE |
| 13 | API + Webhooks + MCP | PENDIENTE |
| 14 | Conectores + Padrón consolidación | PENDIENTE |
| 15 | Auditoría + Hardening + Hindu LIVE | PENDIENTE |

## UX implementado (transversal, no del plan original)

Features de calidad de vida aplicadas a todos los módulos existentes:

- Columnas configurables por usuario (vistas guardadas con nombre)
- Exportación multi-formato (CSV, XLSX, PDF simple, PDF membretado)
- Selección con checkboxes + barra de selección para export parcial
- Templates descargables (CSV + XLSX) para importación
- Importación bulk con validación + dedupe por DNI
- Buscador + filtros en cada módulo
- Búsqueda global (Cmd+K) con resultados agrupados
- Vista mobile (cards) + Vista desktop (tabla) responsive
- Detalle de equipo: composición (DT, capitán, delegados), horarios con recurrencia + vista calendario

## Base de datos

Migrations en `supabase/migrations/`:

| Migration | Contenido |
|---|---|
| `20260504220000_clubcore_init.sql` | Tablas core (tenants, personas, equipos, padrones, atributos, RLS, triggers, catálogos) |
| `20260504222811_fixes_seed_hindu.sql` | Fixes post-seed |
| `20260504230000_seed_hindu.sql` | Datos iniciales Hindu Club |
| `20260505010000_lesiones_rehabilitaciones.sql` | Tablas lesiones y rehabilitaciones |
| `20260505020000_user_vistas.sql` | Tabla user_vistas para vistas guardadas por usuario |
| `20260505100000_entidades_representantes.sql` | Tabla pivote entidades_representantes (persona-entidad con roles) |

Para aplicar: `npx supabase db push` o SQL Editor en dashboard Supabase.

## Estructura del proyecto

```
hindu-v2/
├── app/
│   ├── (public)/              # Login (magic link)
│   ├── admin/                 # Dashboard con sidebar
│   │   ├── personas/          # CRUD personas + ficha detalle en tabs
│   │   ├── equipos/           # CRUD equipos + detalle (plantel, staff, horarios)
│   │   ├── padrones/          # CRUD padrones + miembros + comparador
│   │   ├── externos/          # CRUD entidades externas
│   │   ├── operaciones/       # Placeholder (Sprint 10)
│   │   ├── cajas/             # Placeholder (Sprint 9)
│   │   ├── comunicaciones/    # Placeholder (Sprint 12)
│   │   └── configuracion/     # Placeholder (Sprint 8/11)
│   └── api/                   # Route handlers
├── components/
│   ├── ui/                    # shadcn/ui components + vistas-panel, selection-bar, export
│   └── layout/                # Sidebar, topbar, global-search, theme
├── lib/
│   ├── supabase/              # Server/client/middleware clients
│   ├── export/                # formats.ts (CSV/XLSX/PDF), template.ts
│   ├── vistas/                # column-defs.ts, actions.ts (guardar vistas)
│   └── search/                # global-search.ts
├── supabase/
│   ├── migrations/            # Numeradas por timestamp
│   └── seed.sql               # Datos iniciales
├── docs/                      # Estándares técnicos del proyecto
│   ├── ARCHITECTURE.md        # Separación de capas, patrón de módulo
│   ├── UI-UX.md               # Responsive, shadcn v4, patterns
│   ├── DESIGN-SYSTEM.md       # Colores, tipografía, componentes
│   ├── POSTGRES.md            # RLS, migraciones, Supabase CLI
│   ├── WORKFLOW.md            # Checklists, verificación, ABM
│   └── SKILL-CHALLENGE.md     # Pre-mortem para planes
├── middleware.ts              # Auth middleware (Supabase SSR)
├── CLAUDE.md                  # Instrucciones para agentes IA
├── MASTER-GAPS.md             # Estado del proyecto + pendientes
└── package.json
```

## Convenciones

- **Tablas:** `snake_case_plural` (personas, equipos)
- **Columnas:** `snake_case_singular` (nombre, fecha_nacimiento)
- **FK:** `nombre_de_tabla_id` (persona_id)
- **Idioma:** Español argentino en DB, código y UI
- **Componentes:** Server Components por defecto, Client solo cuando necesario
- **Mutations:** Server Actions con `revalidatePath`
- **shadcn v4:** usa `render` prop (NO `asChild`) para triggers

## Documentación de referencia

El modelo de datos completo y plan comercial están documentados en:
- `CLAUDE.md` — instrucciones operativas para agentes
- `MASTER-GAPS.md` — estado actual y roadmap detallado
- `docs/` — estándares técnicos

## Owner

Yair Levy Wald — yair@levywald.com
Levy Wald CMO · ClubCore
