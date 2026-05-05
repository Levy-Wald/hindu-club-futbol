# Hindu Club - ClubCore V2

Plataforma SaaS multi-tenant para gestion de clubes deportivos. Cliente piloto: **Hindu Club Futbol**.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Lenguaje:** TypeScript estricto
- **UI:** Tailwind 4 + shadcn/ui v4
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

| Variable | Descripcion |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anonima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (NO commitear) |

## Base de datos

Migrations en `supabase/migrations/`:

| Migration | Contenido |
|---|---|
| `20260504220000_clubcore_init.sql` | Tablas core (tenants, personas, equipos, padrones, atributos, RLS, triggers) |
| `20260504222811_fixes_seed_hindu.sql` | Fixes post-seed |
| `20260504230000_seed_hindu.sql` | Datos iniciales Hindu Club |
| `20260505010000_lesiones_rehabilitaciones.sql` | Tablas lesiones y rehabilitaciones |

Para aplicar: SQL Editor en dashboard Supabase, correr en orden.

## Modulos implementados (Sprint 3)

- **Personas:** CRUD completo, ficha agrupada en tabs (Personal, Deportivo, Salud, Profesional, Club, Documentos, Roles, Vinculos, Padrones, Ficha total)
- **Equipos:** CRUD, edicion inline, horarios, plantel con roles
- **Padrones:** CRUD, miembros, importacion bulk
- **Salud:** Datos medicos, lesiones, rehabilitaciones con historial
- **Deportivo:** Multi-deporte por persona, categoria por equipo, dorsal/rol
- **Exportacion:** Personas (CSV/JSON con seleccion de campos), Equipos (CSV), Padrones (CSV)
- **Roles:** Sistema de atributos (sin tabla de roles separada)

## Estructura del proyecto

```
hindu-v2/
├── app/
│   ├── (public)/              # Login (magic link)
│   ├── admin/                 # Dashboard con sidebar
│   │   ├── personas/          # CRUD personas + ficha detalle
│   │   ├── equipos/           # CRUD equipos + detalle
│   │   ├── padrones/          # CRUD padrones + miembros
│   │   ├── externos/          # Placeholder
│   │   ├── operaciones/       # Placeholder
│   │   ├── cajas/             # Placeholder
│   │   ├── comunicaciones/    # Placeholder
│   │   └── configuracion/     # Placeholder
│   └── api/                   # Route handlers
├── components/
│   ├── ui/                    # shadcn/ui components
│   └── layout/                # Sidebar, topbar, theme
├── lib/
│   └── supabase/              # Server/client/middleware clients
├── supabase/
│   ├── migrations/            # Numeradas por timestamp
│   └── seed.sql               # Datos iniciales
├── docs/                      # Skills y estandares del proyecto
├── middleware.ts              # Auth middleware (Supabase SSR)
├── CLAUDE.md                  # Instrucciones para el agente
├── MASTER-GAPS.md             # Lista de pendientes
└── package.json
```

## Convenciones

- **Tablas:** `snake_case_plural` (personas, equipos)
- **Columnas:** `snake_case_singular` (nombre, fecha_nacimiento)
- **FK:** `nombre_de_tabla_id` (persona_id)
- **Idioma:** Espanol argentino en DB, codigo y UI
- **Componentes:** Server Components por defecto, Client solo cuando necesario
- **Mutations:** Server Actions con `revalidatePath`

## Owner

Yair Levy Wald — yair@levywald.com
