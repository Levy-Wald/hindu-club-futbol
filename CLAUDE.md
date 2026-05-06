# CLAUDE.md — Instrucciones permanentes para el agente

Este archivo lo lee Claude Code en cada sesión. **Tiene precedencia sobre cualquier otra instrucción.**

---

## Proyecto

**ClubCore** — Plataforma SaaS multi-tenant para gestión de clubes deportivos.
Tronco genérico + Módulos vendibles + Configuración por tenant.

**Cliente piloto:** Hindu Club Fútbol.
**Validado contra:** Hindu Club, Hacoaj, Country del Pilar, Capitán Oliver.
**Owner:** Yair Levy Wald (yair@levywald.com) · Levy Wald CMO.
**Repo:** github.com/yamiro12/hindu-club-futbol
**Deploy:** hindu-club.vercel.app
**DB:** Supabase project `hkoizqbptwhnepzbmjql`.

### Visión del producto

ClubCore es un tronco genérico que sirve a TODOS los clientes. La diferencia entre un club, un country y un capitán amateur es solo **qué módulos activan** y **cómo configuran** (qué venden, qué compran, qué disciplinas tienen). El código es el mismo.

**Arquitectura modular:**
- **Capa 1 — Tronco** (personas, padrones, equipos, cajas, empleados, eventos, audit): incluido siempre.
- **Capa 2 — Módulos vendibles** (disciplinas, verticales, canales, integraciones): cada uno con precio.
- **Capa 3 — Configuración por tenant** (productos, sedes, branding, tipos de socio): solo data.

**Canales de conexión (post Hindu LIVE):**
- API REST pública (Sprint 13) — cualquier sistema externo se conecta
- MCP Server (Sprint 13) — agentes IA operan ClubCore
- Webhooks salientes (Sprint 13) — eventos disparan acciones externas
- Bot WhatsApp (post-LIVE) — el game changer, todo funciona hablándole al WA
- Conectores (Sprint 14+) — Zoho, MercadoPago, ATC Sports, Ondepor, etc.

**Productos comerciales sobre la misma base:**
- Hindu Club Fútbol: tronco pro + fútbol + conectores (~USD 249/mes)
- Hacoaj: enterprise + 14 disciplinas + multi-sede (~USD 2,099/mes)
- Country del Pilar: tronco + country_deportivo + 3 disciplinas (~USD 269/mes)
- Capitán Oliver: tronco light + 1 disciplina + bot WA (~USD 25/mes)

### Cómo seguir el proyecto

1. Leer `NEXT-SPRINT.md` — dice exactamente qué hacer ahora
2. Leer `MASTER-GAPS.md` — roadmap completo y estado
3. Seguir el patrón de los módulos existentes (queries/actions/components)
4. Al terminar: actualizar MASTER-GAPS, NEXT-SPRINT, build, commit, push

---

## Stack obligatorio

- Next.js 16 con App Router (NO Pages Router)
- TypeScript estricto (`strict: true`)
- Tailwind 4 + shadcn/ui
- Supabase (Postgres + Auth + Storage)
- pnpm (NO npm, NO yarn)
- Vercel para deploy

---

## Reglas de trabajo (importantes)

### 1. No marcar nada como hecho sin testear

Vos no podés tomar screenshots ni navegar visualmente. Yair (el owner) es el que valida manualmente.

Si no pudiste probar algo end-to-end, marcalo como `PENDIENTE_VALIDACION_VISUAL`. No mientas reportando HECHO algo que no probaste.

Esta regla viene de un proyecto v1 que falló porque el agente reportaba GAPs como completos sin testear, y resultaron estar a medias.

### 2. Sprints chicos

Cada sprint = 1 funcionalidad bien terminada. Mejor 5 puntos completos que 13 a medias.

### 3. Validación manual entre sprints

Yair valida cada sprint antes de pasar al siguiente. Si vos pensás que terminaste, pará y esperá validación.

### 4. Sin sistemas duplicados

Una sola fuente de verdad para cada cosa. Roles = atributos en `personas_atributos`. Sin tablas paralelas. Sin sistemas de roles paralelos.

### 5. Sin features fantasma

Si una feature no está completa con UI + lógica + RLS + tests cuando aplica, no la cuentes como hecha.

### 6. Master-GAPS único

Si hay pendientes, registrá en MASTER-GAPS.md (que vamos a crear cuando empiecen los sprints). Una sola lista de pendientes, una sola fuente de verdad.

### 7. Migrations limpias

- Numeradas (`0001_`, `0002_`, etc.)
- Idempotentes (`CREATE IF NOT EXISTS`)
- Una migration por bloque lógico
- Reversibles cuando se pueda
- Documentadas en header

### 8. Si no entendés, preguntá

Mejor parar y aclarar que avanzar mal. Yair está disponible.

---

## Convenciones técnicas

### Naming
- Tablas: `snake_case_plural` (personas, equipos, audit_log)
- Columnas: `snake_case_singular` (nombre, fecha_nacimiento)
- FK: `nombre_de_tabla_id` (persona_id, equipo_id)
- Booleans: prefijo `es_` o `is_` (es_admin, is_active)
- Timestamps: sufijo `_at` (created_at, updated_at)
- Slugs: kebab-case (admin-sistema)
- Endpoints API: kebab-case (/api/v1/personas-equipos)

### Idioma
- DB y código: español de Argentina
- UI: español rioplatense
- Documentación: español
- Comentarios en código: español

### Tipos obligatorios en tablas operacionales
- `id uuid PK DEFAULT gen_random_uuid()`
- `tenant_id uuid FK NOT NULL` (multi-tenant)
- `created_at timestamptz DEFAULT now()`
- `updated_at timestamptz DEFAULT now()` (trigger auto-update)
- `metadata jsonb DEFAULT '{}'` (extensibilidad)
- Algunas: `deleted_at timestamptz NULL` (soft delete)

### Triggers automáticos
- `trg_set_updated_at`: actualiza updated_at en cada UPDATE
- `trg_audit_log`: registra en audit_log cualquier cambio en tablas core
- `trg_set_tenant_id`: si tenant_id no se especificó, lo toma de sesión

### Funciones helper SQL
- `get_persona_actual()` — devuelve persona logueada con tenant + atributos + módulos
- `get_tenant_actual()` — devuelve tenant_id de la sesión actual
- `tiene_atributo(slug)` — true si la persona logueada tiene el atributo
- `modulo_activo(slug)` — true si el módulo está activo en el tenant
- `dedupe_persona_por_dni(tenant, dni, datos)` — busca/crea por DNI

---

## Estructura del repo

```
hindu-v2/
├── app/
│   ├── (public)/              # Páginas públicas (home, equipos, asociate, legal)
│   ├── admin/                 # Dashboard con sidebar
│   │   ├── personas/          # CRUD + ficha en tabs
│   │   ├── equipos/           # CRUD + detalle (plantel, staff, horarios)
│   │   ├── padrones/          # CRUD + miembros + comparador
│   │   ├── externos/          # CRUD entidades externas
│   │   └── ...                # Placeholders (operaciones, cajas, etc.)
│   └── api/                   # Route handlers
├── components/
│   ├── ui/                    # shadcn + vistas-panel, selection-bar, export
│   └── layout/                # Sidebar, topbar, global-search
├── lib/
│   ├── supabase/              # Server/client/middleware clients
│   ├── export/                # formats.ts, template.ts
│   ├── vistas/                # column-defs.ts, actions.ts
│   └── search/                # global-search.ts
├── supabase/
│   ├── migrations/            # Numeradas por timestamp
│   └── seed.sql
├── docs/                      # Estándares técnicos
├── middleware.ts              # Auth middleware
├── CLAUDE.md                  # ESTE archivo (instrucciones agente)
├── README.md                  # Para humanos
├── MASTER-GAPS.md             # Estado + roadmap + pendientes
└── package.json
```

---

## Variables de entorno

```
NEXT_PUBLIC_SUPABASE_URL=https://hkoizqbptwhnepzbmjql.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<de Yair>
SUPABASE_SERVICE_ROLE_KEY=<de Yair, NO commitear>
```

NUNCA commitear `.env.local` o cualquier archivo con keys reales.

---

## Multi-tenant

Todas las tablas operacionales tienen `tenant_id`. RLS automática filtra por tenant del usuario logueado.

Función `get_tenant_actual()` devuelve el tenant_id del usuario actual basado en `auth.uid()` mapeado a `personas.user_id`.

Una persona pertenece a UN solo tenant. Si necesitás cross-tenant (raro, ej: Anthropic admin), se usa atributo `admin_sistema`.

---

## Sistema de roles

**No hay tabla de roles.** Los roles se modelan como atributos en `personas_atributos`.

Categorías de atributos:
- sistema: admin_sistema, admin_tenant, soporte
- institucional: socio_padron, dirigente, voluntario, dado_de_baja
- deportivo: jugador, capitan, dt, kine, etc.
- familiar: padre_tutor, menor_de_edad
- fusion: jugador_fusion, staff_fusion
- externo: representante_federacion, representante_club_externo
- transversal: vip, requiere_revision

Para asignar rol: insertar row en `personas_atributos` con `atributo_slug`.
Para revocar: marcar `activo = false` (no DELETE, mantenemos histórico).

---

## Sistema modular

Las features avanzadas se organizan en módulos activables por tenant. Tabla `tenant_modulos` define qué tiene activo cada cliente.

Ejemplos de módulos:
- `disciplina_futbol`: operación deportiva fútbol
- `bot_whatsapp_equipo`: bot WA para capitanes
- `country_deportivo`: features para countries
- `api_publica`: API REST + webhooks
- `mcp_server`: para agentes IA

Antes de habilitar features de un módulo en UI o API, verificar que está activo:
```sql
SELECT modulo_activo('disciplina_futbol');
```

---

## Storage buckets

- `public-assets`: logos, fotos públicas, products del shop. URL pública.
- `private-documentos`: aptos médicos, DNIs, contratos. URL firmada con expiración.
- `private-fotos-personales`: fotos de perfil. Solo dentro del tenant.
- `private-comprobantes`: facturas, recibos. URL firmada.

RLS estricta para buckets privados.

---

## Audit log

Todo cambio en tablas core queda en `audit_log` automáticamente vía trigger.

Estructura: actor (user_id, persona_id, origen, ip), acción, entidad afectada, cambios (jsonb antes/después), request_id.

Origen puede ser: web, api, webhook, mcp, system, scheduled_job.

---

## API REST (cuando llegue Sprint 13+)

- Versionada: `/api/v1/`
- RESTful: GET, POST, PATCH, DELETE
- Idempotency keys en POST
- Pagination cursor-based
- OpenAPI 3.1 spec auto-generada
- Rate limiting por API key

Endpoints principales:
- `/api/v1/personas` — CRUD personas
- `/api/v1/equipos` — CRUD equipos
- `/api/v1/vistas/{slug}` — vistas operativas
- `/api/v1/importar/personas` — bulk import

---

## MCP Server (cuando llegue Sprint 13+)

Tools expuestas para agentes IA:
- `buscar_persona(nombre, dni, email)`
- `crear_persona(datos)` con dedupe
- `agregar_atributo(persona_id, atributo, valor)`
- `listar_equipos(filtros)`
- `asignar_persona_equipo(persona_id, equipo_id, rol)`

---

## Si Yair te pide algo que parece desviarse del plan

Dos opciones:
1. **Es un ajuste menor** → hacelo, anotá en MASTER-GAPS si rompe algo del plan original.
2. **Es un cambio estructural** → pará, mostrá impacto, esperá confirmación.

NO improvises sobre cambios estructurales. El modelo de datos es contrato.

---

## Cómo correr el proyecto local

```bash
pnpm install
cp .env.example .env.local
# Yair completa las keys
pnpm dev
# abrir localhost:3000
```

---

## Lo que NO hacer

- NO usar `npm` o `yarn` (solo `pnpm`)
- NO usar Pages Router
- NO usar JavaScript (solo TypeScript)
- NO commitear `.env.local`
- NO crear tablas o features que no estén en el sprint actual
- NO marcar nada como HECHO sin testear
- NO crear sistemas duplicados de roles, capitanes, etc.
- NO improvisar decisiones arquitectónicas
- NO modificar `tenants` o `auth.users` directamente desde código (usar Supabase Auth APIs)

---

---

## Documentacion del proyecto (docs/)

| Archivo | Contenido |
|---------|-----------|
| `docs/ARCHITECTURE.md` | Separacion de capas, patron de modulo, multi-tenant |
| `docs/UI-UX.md` | Responsive, patrones React, shadcn v4, accesibilidad, performance frontend |
| `docs/DESIGN-SYSTEM.md` | Colores, tipografia, espaciado, componentes, auditoria visual |
| `docs/POSTGRES.md` | Indices, RLS optimizada, migraciones seguras, Supabase CLI |
| `docs/WORKFLOW.md` | Proceso de desarrollo, checklists, verificacion, ABM de docs |
| `docs/SKILL-CHALLENGE.md` | Pre-mortem /challenge para analizar planes antes de ejecutar |
| `docs/BRAND-DESIGN-SYSTEM.md` | Colores, tipografía, componentes, responsive, dark mode, SEO, performance, seguridad |

---

## Workflow obligatorio (ABM de docs)

Al iniciar cada sesion:
1. Leer `CLAUDE.md`, `MASTER-GAPS.md`, y los archivos en `docs/` relevantes a la tarea.

Al terminar cada sesion de trabajo:
2. Actualizar `MASTER-GAPS.md` con items completados o nuevos pendientes.
3. Si se tomaron decisiones arquitectonicas, actualizar el doc correspondiente en `docs/`.

Esto garantiza que la documentacion siempre refleja el estado real del proyecto.

---

## Progreso actual

Sprints 1-8 del plan original de 15: COMPLETADOS + UX transversal.
Sprint pendiente: 9 (Cajas + Movimientos + Productos).
Ver `NEXT-SPRINT.md` para instrucciones exactas de qué hacer ahora.
Ver `MASTER-GAPS.md` para roadmap completo.

## Plan de 15 sprints → Hindu LIVE

| Sprint | Contenido | Estado |
|--------|-----------|--------|
| 1 | Foundation (migrations, auth, layout, RLS, deploy) | HECHO |
| 2 | ABM Personas + Vista Global | HECHO |
| 3 | Padrones + Importación masiva | HECHO |
| 4 | Equipos + Categorías + Horarios + Asignaciones | HECHO |
| 5 | Vínculos + Tutores/Padres + Bajas | HECHO |
| 6 | Entidades + Federaciones + Fusiones | HECHO |
| 7 | Mi Perfil + Mi Equipo + Calendario/Eventos | HECHO |
| 8 | Páginas públicas + Branding + Pre-inscripción | HECHO |
| 9 | Cajas + Movimientos + Productos | PENDIENTE ← PRÓXIMO |
| 10 | Operaciones deportivas avanzadas | PENDIENTE |
| 11 | Empleados + Contratos + Liquidaciones | PENDIENTE |
| 12 | Comunicaciones | PENDIENTE |
| 13 | API + Webhooks + MCP | PENDIENTE |
| 14 | Conectores + Padrón consolidación | PENDIENTE |
| 15 | Auditoría + Hardening + Hindu LIVE | PENDIENTE |

Post-LIVE: bot WA, Capitán Oliver, más disciplinas, countries, app móvil.

---

**Última actualización:** 2026-05-05
**Versión:** Sprints 1-8 completos + UX transversal
**Plan:** 15 sprints hasta Hindu LIVE
**Owner:** Yair Levy Wald
