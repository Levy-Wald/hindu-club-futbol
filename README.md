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
- **Dependencias clave:** next-themes (dark mode), html-to-image (export PNG), sonner (toasts), lucide-react (iconos)

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
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (`hkoizqbptwhnepzbmjql`) |
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
| 7 | Mi Perfil + Mi Equipo + Calendario/Eventos | HECHO |
| 8 | Páginas públicas + Branding + Pre-inscripción | HECHO |
| 9 | Finanzas: Cajas + Movimientos + Productos + Cuotas + Plan de Cuentas | HECHO |
| 10 | Operaciones deportivas avanzadas | PENDIENTE ← PRÓXIMO |
| 11 | Empleados + Contratos + Liquidaciones | PENDIENTE |
| 12 | Comunicaciones | PENDIENTE |
| 13 | API + Webhooks + MCP | PENDIENTE |
| 14 | Conectores + Padrón consolidación | PENDIENTE |
| 15 | Auditoría + Hardening + Hindu LIVE | PENDIENTE |

## Estructura del proyecto

```
hindu-v2/
├── app/
│   ├── (public)/                    # Páginas públicas (sin auth)
│   │   ├── page.tsx                 # Home (7 secciones)
│   │   ├── equipos/                 # Listado + detalle público
│   │   ├── asociate/                # Pre-inscripción multi-step
│   │   ├── terminos/                # Términos y condiciones
│   │   ├── privacidad/              # Política de privacidad
│   │   └── _lib/queries.ts          # Queries compartidas públicas
│   ├── admin/                       # Panel admin (requiere auth)
│   │   ├── personas/                # CRUD + ficha detalle (10 tabs)
│   │   │   ├── [id]/                # Detalle con historial
│   │   │   └── importar/            # Import bulk CSV
│   │   ├── padrones/                # CRUD + miembros + comparador
│   │   │   ├── [id]/                # Detalle + importar miembros
│   │   │   └── comparar/            # Comparador de padrones
│   │   ├── equipos/                 # CRUD + plantel + horarios
│   │   │   ├── [id]/                # Detalle (plantel, staff, calendario, config)
│   │   │   └── importar/            # Import bulk
│   │   ├── externos/                # CRUD entidades (proveedores, federaciones)
│   │   │   └── [id]/                # Detalle con representantes
│   │   ├── finanzas/                # Módulo financiero completo
│   │   │   ├── page.tsx             # Dashboard financiero
│   │   │   ├── cajas/               # ABM cajas + detalle
│   │   │   ├── movimientos/         # ABM movimientos + filtros
│   │   │   ├── productos/           # ERP productos (30+ campos) + importar
│   │   │   ├── cuotas/              # Planes, emisiones, estado
│   │   │   └── plan-cuentas/        # Plan de cuentas jerárquico
│   │   ├── mi-perfil/               # Perfil del usuario logueado
│   │   ├── mi-equipo/               # Vista por rol (jugador/DT/staff)
│   │   ├── mi-cuenta/               # Cuenta corriente personal
│   │   ├── pre-inscripciones/       # Admin de pre-inscripciones
│   │   ├── configuracion/           # Config del tenant
│   │   │   └── branding/            # Branding Studio (6 tabs)
│   │   ├── operaciones/             # Placeholder (Sprint 10)
│   │   └── comunicaciones/          # Solicitudes (parcial)
│   ├── api/
│   │   └── auth/callback/           # Supabase auth callback
│   └── login/                       # Magic link login
├── components/
│   ├── ui/                          # shadcn + vistas-panel, selection-bar, export
│   └── layout/                      # Sidebar, topbar, global-search, theme
├── lib/
│   ├── supabase/                    # Server/client/middleware clients
│   ├── export/                      # formats.ts (CSV/XLSX/PDF), template.ts
│   ├── vistas/                      # column-defs.ts, actions.ts
│   └── search/                      # global-search.ts
├── supabase/
│   └── migrations/                  # 15 migrations (ver sección DB)
├── docs/                            # 8 archivos de documentación
├── middleware.ts                     # Auth middleware (solo /admin/*)
├── CLAUDE.md                        # Instrucciones para agentes IA
├── MASTER-GAPS.md                   # Estado del proyecto + roadmap
├── NEXT-SPRINT.md                   # Qué hacer ahora (Sprint 10)
└── package.json
```

## Base de datos

### Migrations (`supabase/migrations/`)

| Migration | Sprint | Contenido |
|---|---|---|
| `20260504220000_clubcore_init.sql` | 1 | Tablas core (tenants, personas, equipos, padrones, atributos, entidades, sedes, canchas, horarios, catálogos, RLS, triggers) |
| `20260504222811_fixes_seed_hindu.sql` | 1 | Fixes post-seed |
| `20260504230000_seed_hindu.sql` | 1 | Datos iniciales Hindu Club (tenant, persona Yair, federaciones) |
| `20260505010000_lesiones_rehabilitaciones.sql` | 2 | Tablas lesiones y rehabilitaciones |
| `20260505020000_user_vistas.sql` | UX | Tabla user_vistas para vistas guardadas por usuario |
| `20260505100000_entidades_representantes.sql` | 6 | Tabla pivote entidades_representantes (persona-entidad con roles) |
| `20260505200000_sprint7_solicitudes_indumentaria.sql` | 7 | Solicitudes de indumentaria |
| `20260505210000_equipo_torneo.sql` | 7 | Campos de torneo en equipos |
| `20260505220000_eventos_calendario.sql` | 7 | Eventos con fecha real, hora_citacion, titulo, descripcion |
| `20260505_sprint8_public_pages.sql` | 8 | tenant_config_publica, pre_inscripciones, RLS pública |
| `20260506_modulo_finanzas.sql` | 9 | Cajas, movimientos, categorías, plan de cuentas, cuotas, emisiones, cuentas corrientes, medios de pago, config financiera |
| `20260506_modulo_finanzas_seed.sql` | 9 | Seed datos financieros Hindu |
| `20260506_modulo_finanzas_tipos_producto.sql` | 9 | 13 tipos de producto |
| `20260506_modulo_finanzas_producto_erp.sql` | 9 | Productos ERP (30+ columnas) |
| `20260506_branding_campos_extra.sql` | 9 | Fuentes, secciones, palmarés, media en tenant_config_publica |

### Tablas principales (68 tablas)

**Core:** `tenants`, `personas`, `personas_atributos`, `personas_vinculos`, `personas_equipos`, `personas_padrones`, `personas_datos_medicos`, `personas_documentos_identidad`, `personas_documentos_medicos`, `personas_lesiones`, `personas_rehabilitaciones`, `personas_vehiculos`, `personas_obra_social`

**Equipos:** `equipos`, `equipos_horarios`, `categorias_equipo`, `eventos`

**Padrones:** `padrones`, `personas_padrones`

**Entidades:** `entidades`, `entidades_representantes`, `sedes`, `canchas`

**Finanzas:** `cajas`, `movimientos_caja`, `plan_cuentas`, `cuotas_planes`, `cuotas_emitidas`, `cuotas_generadas`, `cuotas_bonificaciones`, `emisiones_cuota`, `cuentas_corrientes`, `centros_costo`, `medios_pago`, `tipos_comprobante`, `periodos_contables`, `config_financiera`, `convenios_pago`, `cotizaciones`, `productos_servicios`, `categorias_movimiento`

**Config:** `tenant_config_publica`, `pre_inscripciones`, `user_vistas`, `tenant_modulos`, `catalogo_modulos`, `audit_log`

**Catálogos (lookup):** `catalogo_atributos`, `catalogo_disciplinas`, `catalogo_estados_padron`, `catalogo_tipos_socio`, `catalogo_roles_equipo`, `catalogo_motivos_baja`, `catalogo_tipos_vinculo`, `catalogo_niveles_competencia`, `catalogo_tipos_documento`, `catalogo_tipos_estudio`, `catalogo_obras_sociales`, `catalogo_tipos_vehiculo`, `catalogo_companias_seguro`, `catalogo_categorias_movimiento`

### Storage buckets

| Bucket | Acceso | Uso |
|--------|--------|-----|
| `public-assets` | Público | Logos, fotos de equipo, indumentaria, branding |
| `private-fotos-personales` | Firmado | Fotos de perfil |
| `private-documentos` | Firmado | Aptos médicos, DNIs, contratos, documentos |

### Funciones SQL helper

| Función | Uso |
|---------|-----|
| `get_tenant_actual()` | Devuelve tenant_id del usuario logueado (SECURITY DEFINER) |
| `get_persona_actual()` | Devuelve persona logueada con atributos |
| `tiene_atributo(slug)` | True si la persona tiene el atributo |
| `modulo_activo(slug)` | True si el módulo está activo en el tenant |
| `dedupe_persona_por_dni(tenant, dni, datos)` | Busca o crea persona por DNI |
| `trg_set_updated_at()` | Trigger: actualiza updated_at en cada UPDATE |

## Convenciones

- **Tablas:** `snake_case_plural` (personas, equipos)
- **Columnas:** `snake_case_singular` (nombre, fecha_nacimiento)
- **FK:** `nombre_de_tabla_id` (persona_id)
- **Idioma:** Español argentino en DB, código y UI
- **Componentes:** Server Components por defecto, Client solo cuando necesario
- **Mutations:** Server Actions con `revalidatePath`
- **shadcn v4:** usa `render` prop (NO `asChild`) para triggers
- **Eliminación:** Soft-delete (`deleted_at` + `activo=false`) en equipos, personas, padrones, entidades. Datos financieros solo se desactivan, no se eliminan.
- **Protección financiera:** Personas y entidades con movimientos de caja o cuotas no se pueden eliminar.

## Documentación

| Archivo | Contenido |
|---------|-----------|
| `CLAUDE.md` | Instrucciones para agentes IA, reglas del proyecto |
| `MASTER-GAPS.md` | Estado completo + roadmap de 15 sprints |
| `NEXT-SPRINT.md` | Qué hacer ahora (Sprint 10) |
| `docs/ARCHITECTURE.md` | Capas, patrón de módulo, multi-tenant, rutas |
| `docs/UI-UX.md` | Responsive, patrones React, shadcn v4, uploads |
| `docs/DESIGN-SYSTEM.md` | Colores, tipografía, componentes admin |
| `docs/BRAND-DESIGN-SYSTEM.md` | Brand colors, público, dark mode, SEO |
| `docs/POSTGRES.md` | Índices, RLS, migraciones, funciones SQL, schema |
| `docs/WORKFLOW.md` | Checklists, verificación, ABM docs |
| `docs/SKILL-CHALLENGE.md` | Pre-mortem para planes complejos |
| `docs/MENORES-TUTORES.md` | Spec menores/tutores (parcialmente implementado) |

## Conexión externa (Sprint 13+)

ClubCore está diseñado para conectarse con sistemas externos:

| Canal | Sprint | Descripción |
|-------|--------|-------------|
| **API REST** | 13 | Endpoints versionados `/api/v1/`, OpenAPI 3.1, API keys, rate limiting |
| **MCP Server** | 13 | Tools para agentes IA (buscar_persona, crear_persona, listar_equipos) |
| **Webhooks** | 13 | Eventos salientes (persona creada, cuota pagada, movimiento registrado) |
| **Bot WhatsApp** | 16+ | Convocatorias, confirmaciones, cobros — todo por WA |
| **Conectores** | 14+ | Zoho CRM, MercadoPago, ATC Sports, Ondepor |

Las queries en `_lib/queries.ts` y actions en `_actions.ts` son funciones puras que se pueden wrappear como endpoints API o MCP tools sin refactor.

## Owner

Yair Levy Wald — yair@levywald.com
Levy Wald CMO · ClubCore
