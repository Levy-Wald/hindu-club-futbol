# ClubCore — Hindu Club Futbol V2

Plataforma SaaS multi-tenant para gestion de clubes deportivos.
Cliente piloto: **Hindu Club Futbol**.

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

| Variable | Descripcion |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase (`hkoizqbptwhnepzbmjql`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anonima de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (NO commitear) |

## Plan de sprints hasta Hindu LIVE

| Sprint | Contenido | Estado |
|--------|-----------|--------|
| 1 | Foundation (migrations, auth, layout, RLS, deploy) | HECHO |
| 2 | ABM Personas + Vista Global | HECHO |
| 3 | Padrones + Importacion masiva | HECHO |
| 4 | Equipos + Categorias + Horarios + Asignaciones | HECHO |
| 5 | Vinculos + Tutores/Padres + Bajas | HECHO |
| 6 | Entidades + Federaciones + Fusiones | HECHO |
| 7 | Mi Perfil + Mi Equipo + Calendario/Eventos | HECHO |
| 8 | Paginas publicas + Branding + Pre-inscripcion | HECHO |
| 9 | Finanzas: Cajas + Movimientos + Productos + Cuotas + Plan de Cuentas | HECHO |
| 10 | Operaciones deportivas (scouting, asistencia, ops semanales) | HECHO |
| 11 | RRHH: Empleados + Contratos + Liquidaciones + Datos laborales | HECHO |
| 11.5 | Refactor Eventos (tabla central + satelites) | PROXIMO |
| 11.6 | Atributos namespacing (`{slug}.{rol}`) | PENDIENTE |
| 11.7 | Renombres finanzas (prefijo `fin_*`) | PENDIENTE |
| 12 | Comunicaciones + Notificaciones + module_events | PENDIENTE |
| 13 | API REST + MCP + Webhooks | PENDIENTE |
| 14 | Mantenimiento + Mapa + Inventario + Reservas | PENDIENTE |
| 15 | Shop completo | PENDIENTE |
| 16 | Hardening + Tests E2E + Hindu LIVE | PENDIENTE |

## Estructura del proyecto

```
hindu-v2/
├── app/
│   ├── (public)/                    # Paginas publicas (sin auth)
│   │   ├── page.tsx                 # Home (7 secciones)
│   │   ├── equipos/                 # Listado + detalle publico
│   │   ├── asociate/                # Pre-inscripcion multi-step
│   │   ├── terminos/                # Terminos y condiciones
│   │   ├── privacidad/              # Politica de privacidad
│   │   └── _lib/queries.ts          # Queries compartidas publicas
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
│   │   ├── finanzas/                # Modulo financiero completo
│   │   │   ├── page.tsx             # Dashboard financiero
│   │   │   ├── cajas/               # ABM cajas + detalle
│   │   │   ├── movimientos/         # ABM movimientos + filtros
│   │   │   ├── productos/           # ERP productos (30+ campos) + importar
│   │   │   ├── cuotas/              # Planes, emisiones, estado
│   │   │   └── plan-cuentas/        # Plan de cuentas jerarquico
│   │   ├── operaciones/             # Ops semanales, asistencia, scouting
│   │   ├── rrhh/                    # RRHH completo
│   │   │   ├── page.tsx             # Dashboard RRHH
│   │   │   ├── contratos/           # ABM contratos
│   │   │   └── liquidaciones/       # ABM liquidaciones
│   │   ├── mi-perfil/               # Perfil del usuario logueado
│   │   ├── mi-equipo/               # Vista por rol (jugador/DT/staff)
│   │   ├── mi-cuenta/               # Cuenta corriente personal
│   │   ├── pre-inscripciones/       # Admin de pre-inscripciones
│   │   ├── configuracion/           # Config del tenant
│   │   │   └── branding/            # Branding Studio (6 tabs)
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
│   └── migrations/                  # 16+ migrations (ver seccion DB)
├── docs/                            # 10 archivos de documentacion
├── middleware.ts                     # Auth middleware (solo /admin/*)
├── CLAUDE.md                        # Instrucciones para agentes IA
├── MASTER-GAPS.md                   # Estado del proyecto + roadmap
├── NEXT-SPRINT.md                   # Que hacer ahora (Sprint 11.5)
└── package.json
```

## Base de datos

### Stats actuales

```
Tablas:        86
Columnas:      1416
Funciones:     66
RLS Policies:  277
FKs:           210
Buckets:       5
Migrations:    16+ archivos
ERRORS seguridad: 0
```

### Tablas principales (86 tablas)

**Core:** `tenants`, `personas`, `personas_atributos`, `personas_vinculos`, `personas_equipos`, `personas_padrones`, `personas_datos_medicos`, `personas_documentos_identidad`, `personas_documentos_medicos`, `personas_lesiones`, `personas_rehabilitaciones`, `personas_vehiculos`, `personas_obra_social`, `personas_eventos_personales`, `personas_datos_laborales`

**Equipos:** `equipos`, `equipos_horarios`, `categorias_equipo`, `eventos`, `evento_asistencias`

**Padrones:** `padrones`, `personas_padrones`

**Entidades:** `entidades`, `entidades_representantes`, `sedes`, `canchas`

**Finanzas:** `cajas`, `movimientos_caja`, `plan_cuentas`, `cuotas_planes`, `cuotas_emitidas`, `cuotas_generadas`, `cuotas_bonificaciones`, `emisiones_cuota`, `cuentas_corrientes`, `centros_costo`, `medios_pago`, `tipos_comprobante`, `periodos_contables`, `config_financiera`, `convenios_pago`, `cotizaciones`, `productos_servicios`

**RRHH:** `rrhh_contratos`, `rrhh_liquidaciones`

**Operaciones:** `scouting_fichas`, `esquemas_tacticos`, `esquema_posiciones`

**Config:** `tenant_config_publica`, `pre_inscripciones`, `user_vistas`, `tenant_modulos`, `catalogo_modulos`, `audit_log`

**Catalogos (lookup):** `catalogo_atributos`, `catalogo_disciplinas`, `catalogo_estados_padron`, `catalogo_tipos_socio`, `catalogo_roles_equipo`, `catalogo_motivos_baja`, `catalogo_tipos_vinculo`, `catalogo_niveles_competencia`, `catalogo_tipos_documento`, `catalogo_tipos_estudio`, `catalogo_obras_sociales`, `catalogo_tipos_vehiculo`, `catalogo_companias_seguro`, `catalogo_categorias_movimiento`, `catalogo_tipos_evento_personal`, `catalogo_areas_trabajo`, `catalogo_puestos`, `catalogo_roles_laborales`

### Storage buckets

| Bucket | Acceso | Uso |
|--------|--------|-----|
| `public-assets` | Publico | Logos, fotos de equipo, indumentaria, branding |
| `private-fotos-personales` | Firmado | Fotos de perfil |
| `private-documentos` | Firmado | Aptos medicos, DNIs, contratos, documentos |
| `private-comprobantes` | Firmado | Facturas, recibos |
| `private-recibos-sueldo` | Firmado | Recibos de sueldo (PDF, JPG, PNG, WebP) |

### Funciones SQL helper

| Funcion | Uso |
|---------|-----|
| `get_tenant_actual()` | Devuelve tenant_id del usuario logueado (SECURITY DEFINER) |
| `get_persona_actual()` | Devuelve persona logueada con atributos |
| `tiene_atributo(slug)` | True si la persona tiene el atributo |
| `modulo_activo(slug)` | True si el modulo esta activo en el tenant |
| `dedupe_persona_por_dni(tenant, dni, datos)` | Busca o crea persona por DNI |
| `trg_set_updated_at()` | Trigger: actualiza updated_at en cada UPDATE |

## Convenciones

- **Tablas:** `snake_case_plural` (personas, equipos)
- **Columnas:** `snake_case_singular` (nombre, fecha_nacimiento)
- **FK:** `nombre_de_tabla_id` (persona_id)
- **Idioma:** Espanol argentino en DB, codigo y UI
- **Componentes:** Server Components por defecto, Client solo cuando necesario
- **Mutations:** Server Actions con `revalidatePath`
- **shadcn v4:** usa `render` prop (NO `asChild`) para triggers
- **Eliminacion:** Soft-delete (`deleted_at` + `activo=false`) en equipos, personas, padrones, entidades. Datos financieros solo se desactivan, no se eliminan.
- **Proteccion financiera:** Personas y entidades con movimientos de caja o cuotas no se pueden eliminar.
- **Prefijos por modulo (nuevos):** `fin_*` (finanzas), `rrhh_*` (RRHH), `ops_*` (operaciones), `com_*` (comunicaciones)

## Documentacion

| Archivo | Contenido |
|---------|-----------|
| `CLAUDE.md` | Instrucciones para agentes IA, reglas del proyecto |
| `MASTER-GAPS.md` | Estado completo + roadmap |
| `NEXT-SPRINT.md` | Que hacer ahora (Sprint 11.5) |
| `docs/PROPUESTA-ARQUITECTONICA.md` | Decisiones arquitectonicas firmes (D1-D13) |
| `docs/REPORTE-CLEANUP-POST-SPRINT11.md` | Cleanup seguridad post-Sprint 11 |
| `docs/ARCHITECTURE.md` | Capas, patron de modulo, multi-tenant, rutas |
| `docs/UI-UX.md` | Responsive, patrones React, shadcn v4, uploads |
| `docs/DESIGN-SYSTEM.md` | Colores, tipografia, componentes admin |
| `docs/BRAND-DESIGN-SYSTEM.md` | Brand colors, publico, dark mode, SEO |
| `docs/POSTGRES.md` | Indices, RLS, migraciones, funciones SQL, schema |
| `docs/WORKFLOW.md` | Checklists, verificacion, ABM docs |
| `docs/SKILL-CHALLENGE.md` | Pre-mortem para planes complejos |

## Conexion externa (Sprint 13+)

ClubCore esta disenado para conectarse con sistemas externos:

| Canal | Sprint | Descripcion |
|-------|--------|-------------|
| **API REST** | 13 | Endpoints versionados `/api/v1/`, OpenAPI 3.1, API keys, rate limiting |
| **MCP Server** | 13 | Tools para agentes IA (buscar_persona, crear_persona, listar_equipos) |
| **Webhooks** | 13 | Eventos salientes (persona creada, cuota pagada, movimiento registrado) |
| **Bot WhatsApp** | 16+ | Convocatorias, confirmaciones, cobros — todo por WA |
| **Conectores** | 14+ | Zoho CRM, MercadoPago, ATC Sports, Ondepor |

## Owner

Yair Levy Wald — yair@levywald.com
Levy Wald CMO · ClubCore
