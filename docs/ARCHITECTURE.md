# Arquitectura — Plataforma SaaS Multimodal

> Documento canonico v3. Reescrito en Sprint H4 (Tramo 2 Hardening).
>
> Ultima actualizacion: 15 de mayo de 2026.

---

## Vision

Plataforma SaaS multi-vertical que permite a cualquier organizacion (club deportivo, estudio profesional, agencia, retailer) gestionar personas, finanzas, comunicaciones, operaciones y mas, sobre una base comun extensible por modulos. El primer vertical productivo es CCBP (Clubes, Countries y Barrios Privados), operado por Hindu Club.

---

## Stack

| Capa | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router) + React 19 + Tailwind 4 + shadcn v4 + base-ui |
| Backend | Supabase (PostgreSQL 15+ con RLS + Auth + Storage) |
| Hosting | Vercel |
| Email | Resend (mock hasta FASE 16) |
| Pagos | MercadoPago (mock hasta FASE 16) |
| Crons | Vercel Cron |
| Tipos | TypeScript estricto |
| Tests | Playwright (E2E) + Vitest (unit) |
| Package manager | pnpm |

**IDs de proyecto:**
- Supabase: `hkoizqbptwhnepzbmjql`
- Vercel: `prj_aN8r0WqMtZOZYRRKoPQggm8TtYZw`
- Vercel team: `team_clOmQCObDDN8okRHBc4wRhZ9` (Servicios cLevel SRL)

**Stack fuera de alcance:** Redis, message queues, microservicios, ORMs (Prisma/Drizzle), tRPC, GraphQL.

---

## Capas (RFC-004, ADR-040)

### Capa 0 — Troncal universal

Lo que necesita CUALQUIER negocio el dia 1. Universal, agnostico de industria.

9 bloques minimos (ADR-041):

1. **Configuracion del negocio** — tenants, sedes, espacios, modulos activos, config financiera
2. **CRM** — personas, entidades, vinculos, padrones, atributos, importadores
3. **ERP Finanzas basico** — cajas, movimientos, plan de cuentas, periodos contables, comprobantes, cotizaciones, convenios, cuenta corriente, conciliacion bancaria, reportes (Libro Mayor, Balance, EERR, Cobranzas)
4. **PIM Nivel 1** — catalogo de productos + variantes + categorias jerarquicas + marcas + galeria + proveedores + responsables
5. **Cobranza recurrente** — cuotas, emisiones, suscripciones, planes, pagos, bonificaciones, convenios de pago
6. **Motor de Comunicaciones** — plantillas, envios, mensajes in-app, segmentos, lotes
7. **Eventos & Calendario** — eventos genericos, invitados, asistencias basicas
8. **Proyectos & Tareas** — mini-Trello (pendiente A6)
9. **Auditoria & Seguridad** — audit_log, API keys, rate limiting, abuse blocks

Reglas del troncal:
- Cualquier vertical depende de TODOS los bloques troncales.
- Pantallas troncales NO importan logica de verticales.
- El troncal es agnostico de industria.

### Capa 1 — Cross-vertical

Modulos opcionales reutilizables entre verticales. Se activan por tenant.

| Modulo | Descripcion |
|---|---|
| Asistencias | Registro de asistencia a eventos |
| Reservas de espacios | Reserva de canchas/salas/espacios |
| POS / Concesiones | Punto de venta concesionado con aislamiento financiero |
| Inventario / Utileria | Items de utileria + solicitudes + kits |
| Acceso fisico | Logs de acceso con credenciales |
| Pre-inscripciones | Captacion digital de nuevos miembros |
| Documentos / Firma digital | Versionado + audit trail (D1) |
| Tickets / Solicitudes | SLA + routing rules (D2) |
| RRHH | Contratos + liquidaciones |
| Nominas externas | Items de nomina externa |
| Espacios fisicos | Mapa visual del local (D6) |
| Suscripciones de membresia | Renombre conceptual de Socios (B5) |
| Pricing avanzado (PIM N2) | Listas de precios multiples ARS/USD con TC |
| Stock & Movimientos (PIM N3) | Depositos + stock por espacio + movimientos |

Reglas cross-vertical:
- Activable/desactivable por tenant SIN romper el troncal.
- Puede importar del troncal pero NO de un vertical especifico.
- Dependencias entre cross-verticals documentadas en MODULE-CATALOG.

### Capa 2 — Verticales

Paquetes especificos por industria.

| Vertical | Estado | Modulos propios |
|---|---|---|
| CCBP (Clubes, Countries, Barrios Privados) | Productivo | equipos, entrenamientos, amistosos, tactica, competencias/torneos, salud, scouting, planificadores, partidos |
| Estudios de Arquitectura | Futuro (E1) | proyectos_obra, cronograma, subcontratistas |
| Estudios de Abogacia | Futuro (E2) | casos, audiencias, honorarios |
| Agencias de Publicidad | Futuro (E3) | cuentas, campanas, briefings |
| Retailers PyME | Futuro (E4) | sucursales, promociones, vidriera digital |

Reglas verticales:
- Declara explicitamente que cross-verticals usa.
- NO puede importar de otro vertical.
- Si dos verticales necesitan algo comun, se promueve a cross-vertical.

### Capa 3 — Conectores (marketplace)

Integraciones con sistemas externos, vendibles como add-ons por tenant.

| Categoria | Conectores |
|---|---|
| Comunicacion | Resend, WhatsApp Business API, Twilio |
| Pago | MercadoPago, Stripe, Modo |
| Fiscal | AFIP, DIAN, SII |
| eCommerce | Tiendanube, Shopify, WooCommerce |
| Calendar | Google Calendar, Outlook |
| Storage | Cloudflare R2 |
| OCR | Google Document AI |
| PIM Enterprise | Sales Layer, Plytix, Akeneo |
| ChatOps | Slack, Discord, Teams |

Reglas de conectores:
- Mock-first universal (ADR-035): mockeados en desarrollo, reales post-validacion.
- Un conector NO es dependencia hard de un modulo troncal. Siempre hay fallback mockeado.

---

## Reglas de dependencia entre capas

Flujo descendente permitido:
- Capa 1 (cross-vertical) PUEDE depender de Capa 0 (troncal)
- Capa 2 (vertical) PUEDE depender de Capa 0 y Capa 1
- Capa 3 (conector) PUEDE ser usado por cualquier capa superior

Flujo ascendente NO permitido:
- Capa 0 NO depende de ninguna otra capa
- Capa 1 NO depende de Capa 2
- Capa 2 NO depende de otra Capa 2

---

## Patrones arquitectonicos

### Multi-tenancy via RLS

- Toda tabla de negocio tiene `tenant_id`.
- Toda RLS policy filtra por `tenant_id`.
- Toda query desde server action tambien filtra por `tenant_id` en codigo (no solo RLS).
- Excepciones: catalogos globales (sin `tenant_id`).
- `TENANT_ID = '11111111-1111-1111-1111-111111111111'` (hardcoded dev, migracion a JWT real en Sprint 17b).

### Soft-delete con `deleted_at`

- Tablas operativas usan `deleted_at timestamptz` para soft-delete.
- Queries filtran `WHERE deleted_at IS NULL` por defecto.
- Excepciones: tablas log/media inmutables, catalogos con `activo boolean`.

### Audit log universal

- Tabla `audit_log` registra operaciones sensibles.
- Triggers `trg_audit_log_*` en tablas criticas (personas, tenants).
- 46,000+ filas al 14-may-2026.

### Trigger `trg_set_updated_at`

- Toda tabla con `updated_at` debe tener trigger que usa la funcion `trg_set_updated_at()`.
- NUNCA usar `set_updated_at()` (nombre incorrecto).

### FKs salientes solo a troncal/catalogo

- Las tablas de modulos solo apuntan FK a tablas del troncal o catalogos.
- FKs cruzadas entre modulos requieren ADR explicito.

### Polimorfismo entidad/persona

- Patron: `tipo` (enum) + `id` (FK) para referenciar persona o entidad.
- Usado en: producto_proveedores, producto_responsables, evento_asistencias.

### PostgREST con hints de FK

- FK joins de PostgREST devuelven arrays: usar `as unknown as Type`.
- Para queries complejas, preferir queries separadas sobre FK join syntax.

### Mock-first universal (ADR-035)

- Todo servicio externo en modo mock hasta FASE 16.
- Interface tipada → MockAdapter → Factory con env var → API publica.
- El switch a produccion real NO requiere cambio de codigo.

---

## Convenciones de codigo

### Estructura del repositorio

```
/
├── /app                   → Next.js App Router
│   ├── /(public)          → Rutas publicas (sin auth)
│   ├── /admin             → Rutas privadas (con auth + RLS)
│   │   ├── /(troncal)/    → Route group para troncal
│   │   └── /(modulos)/    → Route group para modulos
│   └── /api               → API REST v1 + crons
├── /modules               → Modulos componibles (29 modulos)
│   └── /<slug>/           → Un modulo
│       ├── module.json    → Manifiesto declarativo
│       ├── /lib/          → Actions, queries, logica
│       └── /ui/           → Componentes del modulo
├── /components            → Componentes UI reutilizables
├── /lib                   → Logica reutilizable (troncal)
├── /docs                  → Documentacion viva
├── /supabase              → Migrations + types generados
├── /tests/e2e             → Tests E2E Playwright
└── /styles                → Design tokens (tokens.css)
```

### Naming

| Elemento | Convencion | Ejemplo |
|---|---|---|
| Tabla BD | `snake_case`, plural | `personas`, `cuotas_emitidas` |
| Columna BD | `snake_case` | `numero_documento`, `fecha_alta` |
| FK | `<tabla_referenciada>_id` | `persona_id`, `tenant_id` |
| Funcion SQL | `fn_` operaciones, `sync_` sync, `trg_` triggers | `fn_emitir_cuotas_masivas` |
| Vista | `v_` prefijo | `v_libro_mayor` |
| Catalogo | `catalogo_<concepto>` | `catalogo_disciplinas` |
| Tabla modulo | `<modulo>_<concepto>` | `rrhh_contratos`, `com_envios` |
| Archivo componente | `kebab-case.tsx` | `personas-table.tsx` |
| Componente | `PascalCase` | `PersonasTable` |
| Server action | `camelCase` | `crearPersona` |
| Tipo/Interface | `PascalCase` | `CrearPersonaInput` |
| Constante | `SCREAMING_SNAKE_CASE` | `TENANT_ID` |

### Server actions vs API routes

- **Mutaciones**: siempre server actions (`'use server'`).
- **Reads en RSC**: query directa o funcion en `_lib/queries.ts`.
- **Reads en client component**: API route GET (query-only).
- **API routes**: exclusivamente para reads, endpoints publicos (`/api/v1/*`), crons (`/api/cron/*`).

### UI

- Layout de listado: header → stats → botonera (siempre arriba) → filtros → tabla → paginacion.
- Mobile-first. Breakpoints: sm(640), md(768), lg(1024).
- shadcn v4 con `render` prop (no `asChild`).
- Design tokens en `/styles/tokens.css` (ADR-018). Cero hex codes en className.

---

## Referencias

- RFC-001: Visitantes externos
- RFC-002: (reservado)
- RFC-003: Vertical CCBP completo
- RFC-004: Arquitectura multi-vertical (4 capas)
- RFC-005: Plan de ejecucion completo a 100%
- ADR-INDEX: `docs/adr/ADR-INDEX.md`
- ROADMAP-MASTER v2.0: `docs/ROADMAP.md`
- SPRINT-PLAN v2.1: `docs/SPRINT-PLAN.md`
- DATA-MODEL: `docs/DATA-MODEL.md`
- MODULE-CATALOG: `docs/MODULE-CATALOG.md`
