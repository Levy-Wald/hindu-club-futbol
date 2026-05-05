# Arquitectura - Separacion de capas

## Principio central

La capa grafica (UI/presentacion) esta completamente separada de la capa de datos (DB/logica de negocio).

```
┌─────────────────────────────────────────────┐
│  CAPA DE PRESENTACION (app/, components/)   │
│  - Server Components (render)               │
│  - Client Components (interaccion)          │
│  - Tailwind + shadcn/ui (estilos)           │
└─────────────────┬───────────────────────────┘
                  │ Server Actions / queries
┌─────────────────▼───────────────────────────┐
│  CAPA DE LOGICA (lib/, _lib/, _actions)     │
│  - Server Actions (mutations)               │
│  - Query functions (reads)                  │
│  - Validacion y transformacion              │
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
- Toda query pasa por funciones en `_lib/queries.ts` del modulo.
- Toda mutacion pasa por server actions en `_actions.ts` del modulo.

### Excepcion: Client Components con datos independientes
- Cuando un Client Component necesita datos que no vienen del server parent (ej: cargar lesiones en una tab que se abre despues), puede usar `createClient()` del browser client.
- Esto es aceptable porque mantiene la separacion logica: el componente no sabe SQL, solo llama `.from('tabla').select(...)`.

### La DB es la fuente de verdad
- No hay estado duplicado en frontend.
- Despues de cada mutacion: `revalidatePath()` para refrescar datos del server.
- No cache manual de datos en React state (excepto formularios en edicion).

### Patron de modulo

Cada modulo (personas, equipos, padrones) sigue:

```
app/admin/{modulo}/
├── page.tsx              # Server Component - lista
├── [id]/
│   └── page.tsx          # Server Component - detalle
├── _lib/
│   └── queries.ts        # Funciones de lectura (server-only)
├── _actions.ts           # Server actions (mutations)
└── _components/          # Componentes del modulo
```

### Tipos
- Los tipos se infieren de las queries de Supabase cuando es posible.
- Interfaces explicitas solo cuando se necesita para props de componentes.
- No duplicar tipos que Supabase ya genera.

## Multi-tenant

- Todas las tablas operacionales tienen `tenant_id`.
- RLS filtra automaticamente por `get_tenant_actual()`.
- El frontend NUNCA pasa `tenant_id` manualmente — lo inyecta la DB via sesion.
- Hardcoded `TENANT_ID` temporal en queries server-side mientras no hay multi-tenant real.
