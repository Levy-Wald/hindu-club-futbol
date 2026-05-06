# Arquitectura — Separación de capas

## Principio central

La capa gráfica (UI/presentación) está completamente separada de la capa de datos (DB/lógica de negocio).

```
┌─────────────────────────────────────────────┐
│  CAPA DE PRESENTACION (app/, components/)   │
│  - Server Components (render)               │
│  - Client Components (interacción)          │
│  - Tailwind + shadcn/ui (estilos)           │
└─────────────────┬───────────────────────────┘
                  │ Server Actions / queries
┌─────────────────▼───────────────────────────┐
│  CAPA DE LOGICA (lib/, _lib/, _actions)     │
│  - Server Actions (mutations)               │
│  - Query functions (reads)                  │
│  - Validación y transformación              │
└─────────────────┬───────────────────────────┘
                  │ Supabase client
┌─────────────────▼───────────────────────────┐
│  CAPA DE DATOS (supabase/)                  │
│  - Postgres (tablas, FK, constraints)       │
│  - RLS policies (seguridad)                 │
│  - Triggers (audit, timestamps)             │
│  - Functions (helpers)                      │
└─────────────────────────────────────────────┘
```

## Reglas

### UI nunca habla directo con la DB
- Los componentes NO importan el cliente de Supabase directamente.
- Toda query pasa por funciones en `_lib/queries.ts` del módulo.
- Toda mutación pasa por server actions en `_actions.ts` del módulo.

### Excepción: Client Components con datos independientes
- Cuando un Client Component necesita datos que no vienen del server parent (ej: cargar lesiones en una tab que se abre después), puede usar `createClient()` del browser client.
- Esto es aceptable porque mantiene la separación lógica: el componente no sabe SQL, solo llama `.from('tabla').select(...)`.

### La DB es la fuente de verdad
- No hay estado duplicado en frontend.
- Después de cada mutación: `revalidatePath()` para refrescar datos del server.
- No cache manual de datos en React state (excepto formularios en edición).

## Patrón de módulo

Cada módulo sigue esta estructura:

```
app/admin/{modulo}/
├── page.tsx              # Server Component — lista
├── [id]/
│   ├── page.tsx          # Server Component — detalle
│   └── _components/      # Componentes del detalle
├── importar/
│   ├── page.tsx          # Import bulk (si aplica)
│   └── _actions.ts       # Actions de importación
├── _lib/
│   └── queries.ts        # Funciones de lectura (server-only)
├── _actions.ts           # Server actions (mutations)
└── _components/          # Componentes del módulo (tabla, forms, etc.)
```

### Módulos multi-página (ej: Finanzas)

Cuando un módulo tiene sub-secciones, se organiza con layout compartido:

```
app/admin/finanzas/
├── layout.tsx            # Layout compartido (opcional)
├── page.tsx              # Dashboard del módulo
├── cajas/
│   ├── page.tsx          # Lista de cajas
│   └── [id]/page.tsx     # Detalle caja
├── movimientos/
│   ├── page.tsx          # Lista de movimientos
│   └── _actions.ts       # Actions propias
├── productos/
│   ├── page.tsx          # Lista de productos
│   ├── importar/         # Wizard de importación (4 pasos)
│   └── _actions.ts       # Actions propias
├── cuotas/
│   └── page.tsx          # 3 tabs (planes, emisiones, estado)
├── plan-cuentas/
│   └── page.tsx          # Plan de cuentas jerárquico
├── _lib/queries.ts       # Queries compartidas del módulo
└── _actions.ts           # Actions compartidas del módulo
```

## Capas de la aplicación

### 1. Páginas públicas — `app/(public)/`

- Sin autenticación requerida
- Layout propio con header (logo, nav, login) + footer (contacto, redes, legal)
- Datos leídos de `tenant_config_publica` para branding dinámico
- Rutas: `/`, `/equipos`, `/equipos/[id]`, `/asociate`, `/terminos`, `/privacidad`
- Pre-inscripción con insert anónimo (RLS: INSERT WITH CHECK true)

### 2. Panel admin — `app/admin/`

- Requiere autenticación (middleware valida sesión)
- Layout con sidebar colapsable + topbar + búsqueda global (Cmd+K)
- Sidebar con secciones colapsables (ej: Finanzas)
- Cada módulo sigue el patrón estándar

### 3. Auth — `app/login/` + `app/api/auth/callback/`

- Magic link via Supabase Auth
- Callback maneja el intercambio de tokens
- `middleware.ts` protege todas las rutas `/admin/*`

## Redirecciones legacy

Cuando una ruta se mueve, se deja un redirect para no romper bookmarks:

```tsx
// app/admin/cajas/page.tsx — redirige a la nueva ubicación
import { redirect } from 'next/navigation'
export default function Page() { redirect('/admin/finanzas/cajas') }
```

## Multi-tenant

- Todas las tablas operacionales tienen `tenant_id`.
- RLS filtra automáticamente por `get_tenant_actual()`.
- El frontend NUNCA pasa `tenant_id` manualmente — lo inyecta la DB via sesión.
- Hardcoded `TENANT_ID = '11111111-1111-1111-1111-111111111111'` temporal en queries server-side (se reemplazará cuando haya multi-tenant real en Sprint 15+).

## Tipos

- Los tipos se infieren de las queries de Supabase cuando es posible.
- Interfaces explícitas solo cuando se necesita para props de componentes.
- PostgREST FK joins devuelven arrays → castear con `as unknown as Type`.
- No duplicar tipos que Supabase ya genera.

## Eliminación y protección de datos

- **Soft-delete** en equipos, personas, padrones, entidades (`deleted_at` + `activo=false`)
- **Protección financiera**: personas y entidades con movimientos de caja o cuotas NO se pueden eliminar (el server action valida antes)
- **Datos financieros** (cajas, plan de cuentas, movimientos): solo se desactivan o anulan, nunca se eliminan
- Confirmación con `AlertDialog` antes de cualquier eliminación

## Modulos implementados

### RRHH (`app/admin/rrhh/`)

```
app/admin/rrhh/
├── page.tsx                 # Dashboard RRHH
├── contratos/
│   ├── page.tsx             # Lista (server) + ContratosTable (client)
│   └── _components/         # contratos-table, nuevo-contrato-dialog, contratos-filters
├── liquidaciones/
│   ├── page.tsx             # Lista (server) + LiquidacionesTable (client)
│   └── _components/         # liquidaciones-table, nueva-liquidacion-dialog, liquidaciones-filters
├── _lib/queries.ts          # Queries compartidas RRHH
└── _actions.ts              # Server actions compartidas RRHH
```

Empleado = persona con atributo `rrhh.empleado`. No hay tabla `rrhh_empleados`.
Liquidacion genera/anula movimiento_caja automatico via server action.

### Operaciones (`app/admin/operaciones/`)

Ops semanales cross-equipo, confirmaciones asistencia, scouting CRUD completo.
Esquemas tacticos: tablas creadas, UI diferido a Sprint 13.

## Capa de servicios pura (Decision D3)

Desde Sprint 11.5 en adelante, todo modulo nuevo debe tener:

```
lib/modulos/{slug}/
├── services.ts       # Logica pura, NO usa Next ni bypass RLS
├── queries.ts        # SELECTs tipicos
├── mutations.ts      # INSERTs/UPDATEs/DELETEs
├── events.ts         # Emision de module_events
├── permissions.ts    # Que atributo puede que
├── types.ts          # Tipos TS
└── mcp.ts            # MCP tools del modulo
```

Ver `docs/PROPUESTA-ARQUITECTONICA.md` seccion 3.5 para el patron completo.

## Preparacion para conexion externa (Sprint 13+)

Las queries y actions estan disenadas para ser envueltas como:
- **API REST**: route handlers en `app/api/v1/` que llaman las mismas query functions
- **MCP Server**: tools que wrappean las mismas funciones con Zod schemas
- **Webhooks**: triggered desde server actions despues de mutations exitosas
