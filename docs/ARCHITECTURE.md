# ClubCore — Architecture

> Convenciones técnicas, capas, patrones, anti-patrones. Lectura obligatoria
> antes de implementar cualquier feature.
>
> Mantenido por el arquitecto. Cambios requieren aprobación.
>
> Última actualización: 11 de mayo de 2026.

---

## 1. Stack técnico

| Capa | Tecnología | Razón |
|---|---|---|
| Frontend | Next.js 15 (App Router) | SSR, RSC, server actions nativas |
| UI | React 19 + shadcn v4 + base-ui + Tailwind 4 | Componentes accesibles, tipados |
| DB + Auth + Storage | Supabase (PostgreSQL 15+ con RLS) | Multi-tenant nativo, escalable |
| Hosting | Vercel | Deploy automático desde main, edge runtime |
| Email | Resend (pendiente configurar) | Transaccional + masivo |
| Pagos | MercadoPago (Sprint 15d) | Mercado argentino |
| Crons | Vercel Cron | Built-in, scheduling declarativo |
| Tipos | TypeScript estricto | Sin `any` salvo casos justificados |

**Stack fuera de alcance hasta nuevo aviso:** Redis, message queues,
microservicios, ORMs (Prisma/Drizzle), tRPC, GraphQL.

---

## 2. Capas físicas del repositorio

    /
    ├── /app                   → Next.js App Router (rutas + server actions)
    │   ├── /(public)          → Rutas públicas (sin auth)
    │   ├── /admin             → Rutas privadas (con auth + RLS)
    │   ├── /api               → API REST v1 + crons
    │   └── /_components       → Componentes globales del app
    ├── /components            → Componentes UI reutilizables
    │   ├── /ui                → shadcn + componentes propios atómicos
    │   ├── /layout            → Sidebar, topbar, nav
    │   └── /auth              → Forms de login
    ├── /lib                   → Lógica reutilizable
    │   ├── /supabase          → Clientes (server, browser, middleware)
    │   ├── /imports           → Plataforma de imports (pipelines, parsers)
    │   ├── /export            → Exportadores (CSV, XLSX)
    │   ├── /comunicaciones    → Email + notificaciones
    │   ├── /api               → Helpers de API REST
    │   ├── /vistas            → Vistas dinámicas de tablas
    │   └── /search            → Búsqueda global
    ├── /docs                  → Documentación viva (los 7 archivos canónicos)
    ├── /supabase              → Migrations + types generados
    └── /public                → Assets estáticos

---

## 3. Capas lógicas (regla de oro)

Toda feature pertenece a UNA de estas capas. Declarar la capa antes de
implementar.

    ┌─────────────────────────────────────────────────────────────────┐
    │  TRONCAL                                                        │
    │  ├── CRM       (personas, entidades, comunicaciones)            │
    │  ├── ERP       (plan cuentas, cajas, cuotas, productos)         │
    │  └── PIM       (catalogo de productos — embrionario en 2026)    │
    ├─────────────────────────────────────────────────────────────────┤
    │  VERTICAL                                                       │
    │  └── Club Deportivo (equipos, padrones, scouting, asistencias)  │
    ├─────────────────────────────────────────────────────────────────┤
    │  MÓDULOS PARALELOS                                              │
    │  ├── RRHH                                                       │
    │  ├── Salud / Datos sensibles                                    │
    │  └── (futuros: MKT, Legales, Workflows)                         │
    ├─────────────────────────────────────────────────────────────────┤
    │  PLATAFORMA (infraestructura transversal)                       │
    │  ├── Multi-tenant (tenants, módulos, sedes)                     │
    │  ├── Auth + RLS                                                 │
    │  ├── Importadores (pipelines genéricos)                         │
    │  ├── API REST v1                                                │
    │  └── Audit + logs                                               │
    └─────────────────────────────────────────────────────────────────┘

Detalle de qué tablas pertenecen a cada capa: ver `MASTER-PROJECT.md` §3 y
`CURRENT-STATE.md`.

---

## 4. Multi-tenant — reglas inquebrantables

### R-MT1 — Toda tabla de negocio tiene `tenant_id`

Excepciones permitidas: solo catálogos globales (`catalogo_modulos`,
`audit_log` global no, audit por tenant).

### R-MT2 — Toda RLS policy filtra por `tenant_id`

```sql
CREATE POLICY tenant_isolation ON public.tabla_x
  FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

Hoy `tenant_id` viene de un JWT custom o de `lib/tenant.ts` (hardcoded para
desarrollo). Migración a JWT real: Sprint 17b.

### R-MT3 — Toda query desde server action filtra por `tenant_id`

Nunca confiar solo en RLS. El código también filtra.

```ts
// CORRECTO
const { data } = await supabase
  .from('personas')
  .select('*')
  .eq('tenant_id', tenant_id);

// INCORRECTO (depende solo de RLS)
const { data } = await supabase.from('personas').select('*');
```

### R-MT4 — Nada de Hindu en código

Cero strings tipo `'Hindu Club'`, UUIDs hardcoded de Hindu, slugs específicos
del cliente. Si algo es Hindu-específico, vive en DB como configuración de
ese tenant.

Si tenés que escribir "Hindu" en un archivo `.ts` o `.tsx`, parar y consultar
arquitecto. Excepción permitida: tests (cuando existan) y scripts de seed
inicial (`/supabase/seed.sql`).

### R-MT5 — Módulos activables por tenant

Antes de mostrar un menú o feature, chequear `tenant_modulos`. Si el módulo
no está activo para el tenant, ocultar.

---

## 5. Convenciones de naming

### DB

| Elemento | Convención | Ejemplo |
|---|---|---|
| Tabla | `snake_case`, plural | `personas`, `cuotas_emitidas` |
| Columna | `snake_case` | `numero_documento`, `fecha_alta` |
| FK | `<tabla_referenciada>_id` | `persona_id`, `tenant_id` |
| Función SQL | `snake_case`, verbo inicio | `match_persona_fuzzy`, `resolver_o_crear_equipo` |
| Trigger | `trg_<accion>_<tabla>` | `trg_audit_log_tenants` |
| Índice | `<tabla>_<columnas>_idx` | `personas_apellido_idx` |
| Constraint | `<tabla>_<columna>_<tipo>` | `personas_documento_unique` |
| Catálogo | `catalogo_<concepto>` | `catalogo_disciplinas` |
| Tabla módulo | `<modulo>_<concepto>` | `rrhh_contratos`, `com_envios` |
| Tabla relación | `<a>_<b>` | `personas_atributos`, `personas_equipos` |

### TypeScript / React

| Elemento | Convención | Ejemplo |
|---|---|---|
| Archivo componente | `kebab-case.tsx` | `personas-table.tsx` |
| Componente | `PascalCase` | `PersonasTable` |
| Hook | `usePascalCase` | `useDebounce` |
| Server action | `camelCase` | `crearPersona`, `aplicarRun` |
| Función helper | `camelCase` | `normalizeName` |
| Tipo / Interface | `PascalCase` | `CrearPersonaInput` |
| Constante | `SCREAMING_SNAKE_CASE` | `TENANT_ID`, `MAX_FILE_SIZE` |
| Carpeta | `kebab-case` | `pre-inscripciones`, `padron-sync` |

### Rutas

| Patrón | Ejemplo |
|---|---|
| Página `kebab-case` | `/admin/pre-inscripciones` |
| Parámetro dinámico `[name]` o `[...name]` | `/admin/personas/[id]` |
| Grupo de rutas `(grupo)` | `/(public)`, `/(admin)` |
| API endpoint `/api/v1/<recurso>` | `/api/v1/personas` |

---

## 6. Estructura de módulo estándar

Todo módulo en `/app/admin/<modulo>` sigue esta estructura:

    /app/admin/<modulo>/
    ├── page.tsx                  → Listado principal
    ├── _actions.ts               → Server actions del módulo
    ├── _lib/
    │   └── queries.ts            → Funciones de read-only contra DB
    ├── _components/              → Componentes específicos del módulo
    │   ├── <modulo>-table.tsx
    │   ├── <modulo>-filters.tsx
    │   ├── crear-<entidad>-dialog.tsx
    │   └── ...
    ├── [id]/                     → Detalle de entidad
    │   ├── page.tsx
    │   ├── _actions.ts           → Si tiene actions propias
    │   └── _components/
    └── importar/                 → Wizard de imports (legacy — preferir pipelines)
        ├── page.tsx
        └── _components/

### Convención para sub-rutas operativas

Operaciones complejas (importar, sincronizar, comparar) van como sub-ruta
del recurso padre:

    /admin/padrones/[id]/sync/         → Listado sincronizaciones de un padrón
    /admin/padrones/[id]/sync/nuevo    → Iniciar nueva sincronización
    /admin/padrones/[id]/sync/[runId]  → Revisar run específico

**NUNCA crear pantallas "globales" para operaciones que son sobre un recurso
específico.** Ejemplo prohibido: `/admin/imports` global. Toda operación se
accede desde el detalle del recurso.

---

## 7. Server actions vs queries — patrón

### Read-only → función en `_lib/queries.ts`

```ts
// _lib/queries.ts
export async function getPersonas(opts: { tenant_id: string; ... }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('personas')
    .select('id, apellido, nombre')
    .eq('tenant_id', opts.tenant_id);
  if (error) throw error;
  return data;
}
```

Las queries se llaman desde `page.tsx` (Server Component) o desde otras
server actions.

### Mutación → server action en `_actions.ts`

```ts
// _actions.ts
'use server';

export async function crearPersona(input: CrearPersonaInput): Promise<ActionResult> {
  // 1. Validar input
  // 2. Verificar permisos (capa, modulo activo)
  // 3. Ejecutar mutación
  // 4. revalidatePath o revalidateTag
  // 5. Retornar { success, data, error }
}
```

### Tipo de retorno estándar

```ts
type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };
```

NUNCA tirar excepciones desde server actions. Siempre retornar `ActionResult`.

### Llamada desde cliente

```tsx
'use client';
const result = await crearPersona(input);
if (!result.success) {
  toast.error(result.error);
  return;
}
toast.success('Persona creada');
```

---

## 8. Componentes UI — patrones

### Listado de recursos (table page)

Layout obligatorio, de arriba a abajo:

1. Header con título + descripción
2. Cards de stats (si aplica)
3. **Botonera de acciones primarias** (crear, importar, exportar)
4. Filtros + búsqueda
5. Tabla
6. Paginación
7. (Nada debajo de la tabla)

**Regla absoluta:** ningún botón de acción primaria debajo de la tabla.
En mobile, la botonera puede colapsar a un menú "+ Acciones" expandible
pero siempre arriba.

### Forms

- Validación cliente con zod
- Errores inline con `<FormMessage>` de shadcn
- Botón submit con estado loading (`disabled` + spinner)
- Toast de éxito/error post-submit
- En mobile: campos full-width, padding generoso

### Dialogs / Modals

Usar `<Dialog>` de shadcn para creación rápida.
Usar `<Sheet>` para formularios largos (ficha de persona).
Usar `<AlertDialog>` para confirmaciones destructivas (eliminar, descartar).

### Responsividad

- Mobile-first
- Breakpoints Tailwind: `sm` (640), `md` (768), `lg` (1024)
- Tablas: scroll horizontal en mobile, NUNCA forzar al usuario a hacer zoom
- Sidebar: drawer en mobile, fijo en desktop >= md

---

## 9. Importadores como mecanismo genérico

### Filosofía

Cualquier import de datos al sistema (jugadores, suscriptores, productos,
RRHH, etc.) se construye como un **pipeline declarativo** en
`import_pipelines`, no como código nuevo.

    NUEVO IMPORT = 1 INSERT en import_pipelines + (opcional) 1 parser nuevo

### Componentes del sistema

| Pieza | Responsabilidad |
|---|---|
| `import_pipelines` | Catálogo declarativo (slug, parser, field_mappings, apply_rules) |
| `import_runs` | Una corrida (1 archivo subido) |
| `import_rows` | Cada fila procesada (raw + parsed + match + apply status) |
| `import_field_conflicts` | Conflictos detectados durante enriquecimiento |
| `match_persona_fuzzy` | Función SQL de matching por tokens |
| `normalize_name` | Función SQL de normalización (lowercase, unaccent, sin apóstrofes) |
| `agrupado_por_grupo.ts` | Parser para archivos con headers de grupo |
| `aplicarRun` | Ejecutor de apply_rules declarativas |

### Apply rules declarativas

Las acciones que un pipeline puede ejecutar al aplicar:

| Acción | Qué hace |
|---|---|
| `enriquecer_persona` | UPDATE en personas (solo NULLs, registra conflictos) |
| `agregar_atributo` | INSERT en personas_atributos si no existe activo |
| `agregar_deporte_secundario` | Append a array `deportes_secundarios` |
| `crear_persona_nueva` | INSERT en personas + atributos iniciales |
| `insertar_personas_equipos` | INSERT en personas_equipos (resuelve equipo) |

Agregar acción nueva = código en `lib/imports/actions.ts` + entrada en
este doc.

### Cuándo construir un import por código vs pipeline

**Siempre pipeline.** Si tu caso no entra en los parsers disponibles,
construí un parser nuevo y reusalo. Los imports legacy
(`/admin/padrones/[id]/importar/`, `/admin/personas/importar/`) están en
deprecación.

---

## 10. Convenciones de catálogos

### Estructura mínima

Toda tabla de catálogo tiene:

```sql
slug text PRIMARY KEY              -- identificador en código y queries
nombre text NOT NULL               -- label para UI
categoria text                     -- agrupador opcional
descripcion text                   -- opcional
activo boolean NOT NULL DEFAULT true
metadata jsonb DEFAULT '{}'
created_at timestamptz DEFAULT now()
```

Las que son por tenant agregan `tenant_id`. Las globales no.

### Edición desde UI

Todo catálogo se edita desde `/admin/configuracion`. El panel
`catalogos-panel.tsx` lista todos los catálogos editables, permite crear
items y toggle activo.

### Slugs hardcoded en código

**Permitido y esperado:** referenciar slugs específicos en queries y apply
rules (ej: `'suscriptor'`, `'jugador'`). El slug es la API estable del
catálogo.

**No permitido:** referenciar IDs (`uuid`) de items de catálogo en código.

---

## 11. Manejo de errores

### Server actions

```ts
try {
  // ... mutación
  return { success: true, data };
} catch (error) {
  console.error('[crearPersona]', error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Error desconocido'
  };
}
```

### UI

- Errores de form: inline con `<FormMessage>`
- Errores de operación: toast con mensaje accionable
- Errores fatales (auth, conexión): pantalla de error con CTA "Reintentar"
- Estados vacíos: ilustración + texto + CTA, NO tabla vacía sin contexto

### Logs

`console.error` con prefijo `[modulo:funcion]` para grep fácil.
NUNCA `console.log` en producción.

---

## 12. Migrations

### Reglas

- Toda migration aplica via `apply_migration` MCP de Supabase o via CLI.
- Nombre snake_case descriptivo: `add_pipeline_slug_to_padrones`
- Una migration = un cambio cohesivo
- Migrations son irreversibles en producción — pensar antes de aplicar
- Migrations DDL: crear/alterar tablas, índices, funciones, RLS
- Migrations DML: insertar/modificar catálogos. Mantener idempotentes con
  `ON CONFLICT DO NOTHING` o `WHERE NOT EXISTS`

### Seed inicial

`/supabase/seed.sql` contiene los catálogos base que todo tenant nuevo
necesita. Se ejecuta una sola vez al crear tenant.

### Datos de Hindu

NO van en seed. Se cargaron una vez manualmente. Otros clientes cargan los
suyos vía wizard (Sprint 17b) o manual.

---

## 13. Validación con zod

Todo input de server action o API endpoint se valida con zod:

```ts
import { z } from 'zod';

const CrearPersonaSchema = z.object({
  apellido: z.string().min(1).max(100),
  nombre: z.string().min(1).max(100),
  numero_documento: z.string().regex(/^\d{7,8}$/).optional(),
  email_principal: z.string().email().optional(),
});

export async function crearPersona(input: unknown): Promise<ActionResult> {
  const parsed = CrearPersonaSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }
  // ...
}
```

---

## 13.5 Notificaciones in-app

### Modelo

Una notificación es un mensaje dirigido a una persona, generado por un
evento del sistema (vencimiento, asignación, alerta). Vive en tabla
`notificaciones`, se muestra en bell icon de topbar, y desaparece cuando
el usuario la marca leída o archivada.

### Contrato del helper `crearNotificacion(...)`

Cualquier server action que quiera notificar a una persona llama:

```typescript
import { crearNotificacion } from '@/lib/notificaciones/crear'

await crearNotificacion({
  tenant_id,
  destinatario_persona_id: string,
  tipo: NotificacionTipo,      // slug del catálogo
  titulo: string,
  mensaje: string,
  link_accion?: string,        // ruta interna, ej: '/admin/finanzas/cuotas/abc'
  prioridad?: 'baja' | 'media' | 'alta' | 'critica',
  origen_tabla?: string,       // para dedup y trazabilidad
  origen_registro_id?: string,
  metadata?: Record<string, unknown>,
})
```

El helper inserta via `fn_crear_notificacion` (SQL, SECURITY DEFINER).
Dedup: si mismo (origen_tabla, origen_registro_id, tipo, destinatario)
existe en últimas 24h, no duplica.

Para notificar a N personas: `crearNotificacionMasiva(ids, base)`.

### Tipos de notificación

Catálogo `catalogo_tipos_notificacion` con 19 tipos iniciales agrupados
en categorías: finanzas, utileria, salud, sistema.

### Auto-archivado

Cron diario `fn_limpieza_notificaciones_old`: archiva leídas > 30 días,
borra archivadas > 90 días.

### Extensibilidad (no implementado aún)

- FASE 2: email vía Resend según preferencias persona
- FASE 9: WhatsApp
- FASE 10: resumen IA

El contrato de `crearNotificacion` NO cambia con estas extensiones.

---

## 13.6 Concesiones (módulo comercial)

**ADR-025** — Concesiones como módulo separado del plan de cuentas.

### Modelo

6 tablas: `concesionarios`, `concesion_puntos_venta`, `concesion_productos`,
`concesion_ventas`, `concesion_venta_items`, `concesion_canones`.

### Aislamiento financiero (CRÍTICO)

- Las ventas del concesionario **NO generan `movimientos_caja`** del club.
- Solo el canon mensual impacta las finanzas del club.
- Función `fn_registrar_venta_concesion` es SECURITY DEFINER y no toca
  `movimientos_caja` en absoluto.

### Canon mensual

- `fn_calcular_canon_concesion(concesionario_id, periodo)` suma ventas
  confirmadas del período y aplica MAX(calculado, mínimo).
- Snapshot del porcentaje en cada venta (`canon_porcentaje_aplicado`).
- Cron día 6 de cada mes a las 8am (`/api/cron/calcular-canon-mensual`).

### Credenciales MP

- Columna `mp_credenciales_jsonb` en `concesionarios`.
- Acceso controlado vía `fn_obtener_mp_credenciales()` con audit log.
- `mp_modo`: 'mock' (default), 'sandbox', 'production'.

### Permisos

- `admin_concesiones`: gestiona todo.
- Concesionario (persona vinculada): ve sus ventas y registra.
- Helper: `lib/permisos/concesiones.ts`.

### Extensibilidad

- FASE 7: integración real con MercadoPago API.
- FASE 7: cobro automático de canon vía cuota + movimiento.
- FASE 8: reportes consolidados cruzando plan de cuentas.

---

## 13.7 Servicios externos: mock / sandbox / production

Cada integracion externa (Resend, MercadoPago, WhatsApp, AFIP, Twilio,
Meta Cloud, etc.) se construye con 3 modos:

- **mock**: simula la operacion, registra internamente, no requiere
  credenciales. Default en desarrollo y demo.
- **sandbox**: usa entorno test del servicio externo (Resend test
  domain, MP sandbox, etc.). Gratis o muy barato.
- **production**: usa credenciales reales del tenant.

El modo es configurable por tenant via tabla `tenant_servicios_externos`
(a crear en FASE 12 con el wizard de onboarding).

Cambiar de modo NO requiere cambio de codigo. Solo cambio de configuracion.

El producto debe ser 100% demostrable en modo mock antes de pedir
credenciales al tenant.

---

## 14. Anti-patrones prohibidos

### A1 — Hardcodear datos de cliente en código

```ts
// PROHIBIDO
const HINDU_TENANT = '11111111-1111-1111-1111-111111111111';

// CORRECTO
const tenantId = await getCurrentTenantId();
```

### A2 — Bypassear RLS con service role en operaciones de usuario

Service role SOLO para: jobs de sistema, migrations, casos justificados
documentados. Nunca para operaciones disparadas por un usuario logueado.

### A3 — Crear tablas paralelas en vez de extender existentes

```
// PROHIBIDO: tabla nueva "clientes" con datos que ya tiene "personas"
// CORRECTO: atributo 'cliente' sobre personas
```

### A4 — UI con botones primarios debajo de listas

Siempre arriba. Sin excepciones.

### A5 — Crear pantalla global para operación sobre recurso

```
// PROHIBIDO: /admin/imports (global, sin contexto de padrón)
// CORRECTO: /admin/padrones/[id]/sync/nuevo
```

### A6 — `any` en TypeScript sin justificación documentada

Si tenés que usar `any`, agregar comentario explicando por qué.

### A7 — Ignorar errores de Supabase

```ts
// PROHIBIDO
const { data } = await supabase.from('x').select();

// CORRECTO
const { data, error } = await supabase.from('x').select();
if (error) throw error;
```

### A8 — Mutar datos sin idempotencia

Toda operación de escritura debe ser repetible sin generar duplicados.
Hash, unique constraints, checks explícitos.

### A9 — Acoplar UI a estructura de DB

La UI muestra conceptos del dominio, no nombres de columnas. Si la columna
se llama `numero_documento`, la UI puede mostrar "DNI" o "Documento" según
contexto.

### A10 — Comentar código viejo en vez de borrarlo

Git tiene historial. Borrar limpio. No dejar bloques comentados.

---

## 15. Recipe — Cómo agregar un módulo nuevo

Estos son los pasos en orden para incorporar una feature/módulo nuevo.

1. **Declarar capa** (Troncal CRM / ERP / PIM, Vertical, Módulo paralelo, Plataforma).
2. **Modelar tablas** respetando convenciones §5.
3. **Aplicar migration** con RLS habilitada desde el día 1.
4. **Crear entrada en `catalogo_modulos`** si es un módulo activable.
5. **Crear `/app/admin/<modulo>/`** con estructura §6.
6. **Crear `_lib/queries.ts`** para reads.
7. **Crear `_actions.ts`** para mutaciones.
8. **Crear componentes UI** respetando patrones §8.
9. **Agregar al sidebar** en la capa correspondiente.
10. **Si requiere importación inicial**, crear pipeline en `import_pipelines`
    en vez de wizard custom.
11. **Actualizar `CURRENT-STATE.md`** con las nuevas tablas y rutas.
12. **Agregar entrada en `DECISIONS.md`** si tomaste alguna decisión técnica.

---

## 16. Performance — objetivos

| Operación | Objetivo |
|---|---|
| Carga inicial de listado (50 rows) | < 500 ms |
| Búsqueda en tabla | < 300 ms |
| `match_persona_fuzzy` (10k personas) | < 200 ms |
| Apply de run con 200 filas | < 30 seg |
| Importación de archivo Excel 500 filas | < 60 seg incluyendo matching |
| Page load (cold) | < 2 seg |
| Page load (warm) | < 800 ms |

Si una operación supera estos números, investigar y optimizar antes de
deployar.

---

## 17. Seguridad

### S1 — RLS siempre habilitada

Toda tabla nueva tiene RLS desde la migration que la crea.

### S2 — Service role en server actions

El cliente `lib/supabase/server.ts` usa anon key + cookie de sesión.
Service role solo en operaciones de sistema (jobs, migraciones).

### S3 — Validación en server, no solo en cliente

Validación cliente es UX. Validación server es seguridad. Siempre las dos.

### S4 — Inputs sanitizados

Toda input de usuario que llega a SQL pasa por params, nunca string
concatenation.

### S5 — Cron endpoints protegidos

`/api/cron/*` requiere header `Authorization: Bearer <CRON_SECRET>`.
CRON_SECRET debe estar configurada en Vercel (pendiente).

### S6 — API keys con scopes

`/api/v1/*` usa `lib/api/auth.ts` con scopes definidos en
`lib/api/scopes.ts`. Cada endpoint declara qué scope requiere.

---

## 18. Stack de decisiones pendientes (para futuros sprints)

Documentadas en `DECISIONS.md` cuando se tomen:

- D-PENDING-01 — Estrategia de pricing y módulos pagos
- D-PENDING-02 — Separación física troncal/vertical (2027+)
- D-PENDING-03 — Estrategia de tests automatizados
- D-PENDING-04 — Manejo de migraciones de datos entre tenants
- D-PENDING-05 — Estrategia de backups y restore
- D-PENDING-06 — Internacionalización (i18n) — postergada
- D-PENDING-07 — Acceso público de jugadores via app (móvil propia o PWA)

---

## 19. Quién decide qué

| Tipo de decisión | Quién aprueba |
|---|---|
| Bug fix | Code, autonomía total |
| Feature dentro de sprint planeado | Code ejecuta, arquitecto revisa |
| Nueva tabla o cambio de modelo | Arquitecto |
| Cambio de capa lógica de una feature | Arquitecto |
| Cambio en convenciones | Arquitecto + Yair |
| Cambio de stack técnico | Yair |
| Cambio de decisión marco (D1-D8 en MASTER) | Yair |
| Roadmap / prioridades | Yair |

---

## 20. Design Tokens System (ADR-018)

### Estructura

```
styles/
├── tokens.css            ← fuente única de tokens
└── themes/
    └── theme-test.css    ← theme de prueba (no commitear import activo)
app/
└── globals.css           ← importa tokens.css, registra en @theme inline
```

### Tokens disponibles

| Escala | Prefijo Tailwind | Shades | Uso |
|---|---|---|---|
| Neutral | `neutral-*` | 50-950 | Grises, bordes, fondos, texto |
| Brand | `brand-*` | 50-950 | Color primario del tenant |
| Gold | `gold-*` | 50-900 | Color secundario/accent |
| Success | `success-*` | 50-900 | Estados positivos, activo, ok |
| Warning | `warning-*` | 50-900 | Alertas, precaución |
| Error | `error-*` | 50-900 | Errores, destructivo |
| Info | `info-*` | 50-900 | Informativo, azul neutro |

### Reglas

1. **Cero hex codes** en `className`. Excepciones: color pickers
   (branding), colores dinámicos de equipo, libs externas (toPng).
2. **Cero nombres raw** (`green-600`, `red-100`, `gray-500`). Usar
   tokens semánticos (`success-600`, `error-100`, `neutral-500`).
3. **Brand tokens** se overridean en runtime desde `tenant_config_publica`
   vía `<style>` en root layout.
4. **Para agregar un shade:** editar `tokens.css`, registrar en
   `globals.css` `@theme inline`, usar en componentes.
5. **Para un theme completo:** crear archivo en `/styles/themes/`,
   importar después de `tokens.css` en `globals.css`.
