# Hindu Club - ClubCore V2

Plataforma SaaS multi-tenant para gestión de clubes deportivos. Cliente piloto: **Hindu Club Fútbol**.

## Stack

- **Framework:** Next.js 16 (App Router)
- **Lenguaje:** TypeScript estricto
- **UI:** Tailwind 4 + shadcn/ui
- **Base de datos:** Supabase (Postgres + Auth + Storage)
- **Deploy:** Vercel
- **Package manager:** pnpm

## Setup local

```bash
# Clonar el repo
git clone https://github.com/yamiro12/hindu-club-futbol.git hindu-v2
cd hindu-v2

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Completar las keys en .env.local (pedirlas a Yair)

# Correr en desarrollo
pnpm dev
# Abrir http://localhost:3000
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (NO commitear) |

## Base de datos

Las migrations están en `supabase/migrations/`. Para aplicarlas:

1. Abrir el SQL Editor en el dashboard de Supabase
2. Correr `0001_init_core.sql` (tablas core)
3. Correr `seed.sql` (datos iniciales)

## Estructura del proyecto

```
hindu-v2/
├── app/                    # Next.js App Router
│   ├── (public)/           # Rutas sin auth (login)
│   ├── (admin)/            # Rutas con auth (dashboard)
│   └── api/                # Route handlers
├── components/
│   ├── ui/                 # Componentes shadcn
│   ├── layout/             # Sidebar, topbar, theme
│   └── auth/               # Magic link form
├── lib/
│   └── supabase/           # Clientes Supabase
├── supabase/
│   ├── migrations/         # SQL migrations
│   └── seed.sql            # Datos iniciales
├── middleware.ts            # Auth middleware
└── CLAUDE.md               # Instrucciones para el agente
```

## Convenciones

- **Tablas:** `snake_case_plural` (personas, equipos)
- **Columnas:** `snake_case_singular` (nombre, fecha_nacimiento)
- **FK:** `nombre_de_tabla_id` (persona_id)
- **Idioma:** Español argentino en DB, código y UI

## Owner

Yair Levy Wald — yair@levywald.com
