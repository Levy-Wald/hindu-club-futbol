# Reporte de Patrones Arquitectonicos — hindu-v2

**Fecha:** 2026-05-26
**Tag:** `v0.35.1-a4.2-ui-fixes`

---

## 1. Server Actions vs API Routes

| Tipo | Cantidad archivos |
|------|-------------------|
| **Server Actions** (`'use server'`) | **98** |
| **API Routes** (`app/api/**/route.ts`) | **11** |

### Distribucion de Server Actions:
- `modules/*/lib/actions.ts` — 40 archivos (actions de modulos verticales)
- `modules/*/lib/queries.ts` — 15 archivos (queries server-side, tambien marcadas `'use server'`)
- `app/admin/[tenant]/**/_actions.ts` — 18 archivos (actions de paginas troncales)
- `lib/**` — 5 archivos (imports, vistas, search, audit)
- `modules/*/lib/permisos.ts` — 8 archivos (checks de permisos server-side)
- Otros (helpers-contables, smart-defaults, auto-poblar, etc.)

### API Routes (11):
```
app/api/asistencias/
app/api/auth/
app/api/comunicaciones/
app/api/cron/
app/api/dashboard/
app/api/historial-deportivo/
app/api/nomina/
app/api/notificaciones/
app/api/operaciones/
app/api/v1/
```

**Patron:** Server Actions para mutaciones Y queries. API Routes solo para endpoints publicos, cron, webhooks y dashboard widgets. Consistente con lo documentado en CLAUDE.md: "Server actions para mutaciones, API routes solo query-only".

> Nota: en la practica, las queries tambien usan `'use server'` (ej. `modules/*/lib/queries.ts`), no API routes. Las API routes restantes son para acceso sin auth (nomina publica), cron jobs, y endpoints de integracion.

---

## 2. Validacion de inputs

**Framework:** **Zod** (unico). 11 archivos con import de Zod, 43 llamadas a `safeParse`.

**No hay Yup, Joi, ni validacion custom sin schema.**

### Patron canonico:

```typescript
// 1. Schema definido en archivo aparte o al inicio
const crearPersonaSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  // ...
})

// 2. safeParse al inicio de la server action
export async function crearPersona(input: CrearPersonaInput) {
  const parsed = crearPersonaSchema.safeParse(input)
  if (!parsed.success) {
    return formatResult(false, parsed.error.issues[0].message)
  }
  const values = parsed.data
  // ... logica
}
```

### Ejemplo 1 — Personas (`app/admin/[tenant]/(troncal)/personas/_actions.ts:28-65`)
```typescript
export async function crearPersona(input: CrearPersonaInput) {
  const parsed = crearPersonaSchema.safeParse(input)
  if (!parsed.success) {
    return formatResult(false, parsed.error.issues[0].message)
  }
  const values = parsed.data
  const clean = {
    tenant_id: TENANT_ID,
    nombre: values.nombre.trim(),
    // ...
  }
  const { data, error } = await supabase.from('personas').insert(clean).select('id').single()
  if (error) { /* handle */ }
  revalidatePath('/admin/personas')
  return formatResult(true, 'Persona creada', data)
}
```

### Ejemplo 2 — Eventos (`modules/eventos/lib/actions.ts:48-55`)
```typescript
export async function crearEventoAction(input: EventoCreateInput): Promise<ActionResult<{ id: string }>> {
  const persona = await getAuthedPersona()
  if (!persona) return { ok: false, error: 'No autenticado' }
  const parsed = EventoCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }
  const d = parsed.data
  // ...
}
```

### Ejemplo 3 — Finanzas/Cajas (`modules/finanzas/lib/actions.ts:40-56`)
```typescript
// Variante: parseo manual de FormData (sin Zod), validacion inline
function parseCajaInput(formData: FormData): CajaInput {
  return {
    nombre: (formData.get('nombre') as string) || '',
    tipo: (formData.get('tipo') as string) || 'efectivo',
    // ...
  }
}
export async function crearCaja(formData: FormData): Promise<ActionResult> {
  const input = parseCajaInput(formData)
  if (!input.nombre.trim()) return fail('El nombre es obligatorio')
  // ...
}
```

**Inconsistencia detectada:** Finanzas usa parseo manual de `FormData` en vez de Zod. Esto es un patron minoritario (~5 actions) pero rompe la uniformidad.

---

## 3. Manejo de errores en queries Supabase

### Patron mas comun: check de `error` post-query, return early

```typescript
const { data, error } = await supabase
  .from('personas')
  .insert(clean)
  .select('id')
  .single()

if (error) {
  // Opcion A: error generico
  return formatResult(false, error.message)

  // Opcion B: error especifico + fallback
  if (error.code === '23505' && error.message.includes('numero_documento')) {
    return formatResult(false, 'Ya existe una persona con ese documento en este tenant.')
  }
  return formatResult(false, error.message)
}

revalidatePath('/admin/personas')
return formatResult(true, 'Persona creada', data)
```

### Variantes del return type:

| Patron | Usado en |
|--------|----------|
| `{ ok: boolean, message: string, data? }` | `_actions.ts` troncales (personas, padrones, catalogos) |
| `{ ok: true, data } \| { ok: false, error }` | Modulos (eventos, torneos, notificaciones) |
| `{ success: boolean, error?, data? }` | Finanzas |

**Inconsistencia:** Hay 3 variantes del tipo de retorno de actions. No hay un `ActionResult` unificado importado de un solo lugar. Cada modulo define el suyo.

### Manejo en queries (no actions):

En pages server-side, el patron es mas simple — sin error handling explicito:
```typescript
const { data } = await supabase.from('equipos').select('*').eq('tenant_id', TENANT_ID)
const equipos = data ?? []
```

Los errores de queries en pages se ignoran silenciosamente (se asume array vacio). No hay logging ni fallback visible al usuario en la mayoria de pages.

---

## 4. Client de Supabase

**Si, hay un client compartido, con separacion server/client/service-role.**

### `lib/supabase/server.ts` — Server Components + Server Actions
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { ... }, setAll(cookiesToSet) { ... } } }
  )
}
```

### `lib/supabase/client.ts` — Client Components (browser)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `lib/supabase/service-role.ts` — Operaciones admin (bypass RLS)
```typescript
import { createClient } from '@supabase/supabase-js'

export function createServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
```

### `lib/supabase/middleware.ts` — Middleware de Next.js
Usado en `middleware.ts` para refrescar sesion.

**Evaluacion:** Patron limpio y bien separado. Cada contexto tiene su factory. El service-role client desactiva correctamente persistSession y autoRefreshToken.

---

## 5. Manejo de formularios

| Patron | Conteo | Descripcion |
|--------|--------|-------------|
| `useTransition` + `startTransition` | **329 usos** | Patron dominante |
| `react-hook-form` (`useForm`) | **0** | No se usa |
| `useFormState` / `useActionState` | **0** | No se usa |

**Patron dominante: `useState` + `startTransition` + server action directa**

```typescript
// Patron tipico en componentes client
const [isPending, startTransition] = useTransition()

function handleSubmit() {
  startTransition(async () => {
    const result = await crearPersona(formData)
    if (result.ok) {
      toast.success(result.message)
      onClose()
    } else {
      toast.error(result.message)
    }
  })
}

<Button disabled={isPending} onClick={handleSubmit}>
  {isPending ? 'Guardando...' : 'Guardar'}
</Button>
```

**No hay React Hook Form a pesar de tener `@hookform/resolvers` en deps.** La dependencia esta instalada pero no se usa en ningun componente. Los formularios se manejan con `useState` por campo + submit manual.

**Nota:** `react-hook-form` y `@hookform/resolvers` estan en `package.json` como dependencias de produccion pero son **dead dependencies** — 0 imports en el codebase.

---

## 6. Loading states

### Server-side (RSC):

| Mecanismo | Cantidad |
|-----------|----------|
| `loading.tsx` (Next.js) | **7** archivos |
| `<Suspense>` boundaries | **9** usos |
| `error.tsx` (Next.js) | **4** archivos |
| ErrorBoundary custom | **3** usos |

**Cobertura de `loading.tsx`:**
```
app/admin/[tenant]/loading.tsx              (raiz tenant)
app/admin/[tenant]/(troncal)/loading.tsx    (troncal)
app/admin/[tenant]/(modulos)/loading.tsx    (modulos)
app/admin/[tenant]/(modulos)/comunicaciones/loading.tsx
app/admin/[tenant]/competencias/loading.tsx
app/admin/[tenant]/proyectos/loading.tsx
app/admin/[tenant]/reservas/loading.tsx
```

Solo 7 de ~96 rutas tienen `loading.tsx`. Las demas cargan sin skeleton/spinner.

### Client-side:

| Mecanismo | Cantidad |
|-----------|----------|
| `useTransition` (isPending) | **329** (patron dominante para botones) |
| `useQuery` (isLoading/isFetching) | Usado en ~20 componentes con React Query |
| `useState` para loading manual | Disperso, minoritario |

**Evaluacion:** Loading inconsistente. Los botones de submit manejan bien el pending state via `useTransition`, pero la carga inicial de paginas depende de solo 7 `loading.tsx` para ~96 rutas. Las paginas sin `loading.tsx` muestran blank screen hasta que el RSC resuelve.

---

## 7. Optimistic updates

**Si, hay un patron implementado.** Se usa en **asistencias** via React Query's `onMutate`.

### Ejemplo: `modules/asistencias/ui/pantalla-asistencia.tsx`

```typescript
const mutationPersona = useMutation({
  mutationFn: marcarAsistenciaAction,

  // Optimistic update: actualizar cache antes de que el server responda
  onMutate: async (vars) => {
    setMutatingPersonaId(vars.persona_id)
    await queryClient.cancelQueries({ queryKey })
    const previo = queryClient.getQueryData<InvitadosCompleto>(queryKey)

    // Setear el nuevo estado optimisticamente
    queryClient.setQueryData<InvitadosCompleto>(
      queryKey,
      (old) => old
        ? actualizarAsistenciaEnCache(old, vars.persona_id, vars.estado)
        : old
    )
    return { previo } // guardar snapshot para rollback
  },

  // Rollback si falla
  onError: (_err, _vars, ctx) => {
    if (ctx?.previo) queryClient.setQueryData(queryKey, ctx.previo)
    toast.error('Error guardando asistencia, reintenta')
  },

  // Siempre invalidar para sincronizar con server
  onSettled: () => {
    setMutatingPersonaId(null)
    queryClient.invalidateQueries({ queryKey })
  },
})
```

Incluye las 3 funciones de cache update:
- `actualizarAsistenciaEnCache()` — personas
- `actualizarAsistenciaEntidadEnCache()` — entidades
- `actualizarAsistenciaEquipoEnCache()` — equipos

**Alcance:** Solo en asistencias. No se usa `useOptimistic` de React 19. El resto de mutaciones en el codebase son fire-and-wait (startTransition + await action).

---

## Resumen de consistencia

| Patron | Consistente? | Nota |
|--------|-------------|------|
| Server Actions vs API Routes | **Si** | Actions para todo, API solo para publico/cron/webhooks |
| Validacion Zod | **Mayoria** | ~43 safeParse, pero finanzas usa FormData manual en ~5 actions |
| Error handling Supabase | **Parcial** | 3 variantes de ActionResult, queries en pages sin error handling |
| Supabase clients | **Si** | Bien separados: server, client, service-role, middleware |
| Formularios | **Si** | useState + startTransition uniforme. RHF instalado pero no usado (dead dep) |
| Loading states | **Parcial** | 7/96 rutas con loading.tsx. Botones bien manejados con isPending |
| Optimistic updates | **Puntual** | Solo asistencias, bien implementado con React Query |

### Acciones recomendadas (priorizadas):

1. **Unificar ActionResult** — Definir un solo tipo en `lib/troncal/types/` e importar en todos los modulos
2. **Remover dead deps** — `react-hook-form` y `@hookform/resolvers` no se usan
3. **Expandir `loading.tsx`** — Agregar a las ~89 rutas que no lo tienen (o al menos a las mas pesadas)
4. **Migrar finanzas a Zod** — Las ~5 actions con FormData manual deberian usar schemas
5. **Agregar error handling a queries en pages** — Al menos logging server-side para queries que fallan silenciosamente
