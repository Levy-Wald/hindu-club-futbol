# ADR Index

> Ultima actualizacion: 15 de mayo de 2026 (Sprint H4)

## ADRs 001-039 (FASES 1-5)

| ADR | Titulo | Status |
|---|---|---|
| ADR-001 | Supabase como backend unico | Accepted |
| ADR-002 | Next.js App Router como framework | Accepted |
| ADR-003 | Multi-tenancy via RLS | Accepted |
| ADR-004 | Personas como entidad central (no usuarios) | Accepted |
| ADR-005 | Atributos como sistema de roles | Accepted |
| ADR-006 | Server actions para mutaciones | Accepted |
| ADR-007 | Padrones como agrupadores de personas | Accepted |
| ADR-008 | Import pipelines declarativos | Accepted |
| ADR-009 | Match persona fuzzy por tokens | Accepted |
| ADR-010 | Catalogo de modulos activables por tenant | Accepted |
| ADR-011 | Soft-delete con deleted_at | Accepted |
| ADR-012 | Audit log universal | Accepted |
| ADR-013 | PostgREST FK joins con casts | Accepted |
| ADR-014 | shadcn v4 como UI framework | Accepted |
| ADR-015 | Comunicaciones: plantillas + envios + mensajes | Accepted |
| ADR-016 | Eventos polimorficos (persona/entidad/equipo) | Accepted |
| ADR-017 | Cuotas: plan → emision → cuota → pago | Accepted |
| ADR-018 | Design tokens en tokens.css | Accepted |
| ADR-019 | Notificaciones in-app con dedup | Accepted |
| ADR-020 | Cron endpoints protegidos con CRON_SECRET | Accepted |
| ADR-021 | API keys con scopes | Accepted |
| ADR-022 | Reservas de espacios | Accepted |
| ADR-023 | Acceso fisico con credenciales | Accepted |
| ADR-024 | Fuente unica de verdad: roles en personas_equipos.rol_equipo_slug | Accepted |
| ADR-025 | Aislamiento financiero de concesionarios | Accepted |
| ADR-026 | Canon mensual concesionario | Accepted |
| ADR-027 | Pre-inscripciones como captacion digital | Accepted |
| ADR-028 | Torneos: wizard + fixture auto-generador | Accepted |
| ADR-029 | Stats de jugador por partido | Accepted |
| ADR-030 | Planificadores mensual/semanal | Accepted |
| ADR-031 | Arquitectura de 3 capas (troncal + modulos + verticales) | Superseded by ADR-040 |
| ADR-032 | Manifiestos module.json | Accepted |
| ADR-033 | ESLint rules cross-module | Accepted |
| ADR-034 | Tests E2E con Playwright | Accepted |
| ADR-035 | Mock-first universal para servicios externos | Accepted |
| ADR-036 | Permission slugs en dot-notation | Accepted |
| ADR-037 | Datos filtrados frecuentemente en columnas nativas, no jsonb | Accepted |
| ADR-038 | E2E real obligatorio para triggers/jobs/flujos asincronicos | Accepted |
| ADR-039 | Verificacion de produccion solo via MCP | Accepted |

## ADRs 040-046 (RFC-004, FASE A)

| ADR | Titulo | Status |
|---|---|---|
| ADR-040 | Taxonomia de 4 capas (troncal + cross-vertical + vertical + conectores) | Accepted |
| ADR-041 | Troncal minimo: 9 bloques | Accepted |
| ADR-042 | Unificacion productos + servicios con tipo_uso | Accepted |
| ADR-043 | Proveedores/responsables N:M con polimorfismo persona/entidad | Accepted |
| ADR-044 | Listas de precios multiples con vigencia y moneda | Accepted |
| ADR-045 | Stock por espacio con movimientos | Accepted |
| ADR-046 | Refactor modules/finanzas (drop 6 vistas huerfanas) | Accepted |

## ADRs 047-052 (Tramo 2 Hardening)

| ADR | Titulo | Status | Archivo |
|---|---|---|---|
| ADR-047 | Auditoria MCP obligatoria pre-tag | Accepted | `ADR-047-auditoria-mcp-pre-tag.md` |
| ADR-048 | Sub-sprints como modus operandi | Accepted | `ADR-048-sub-sprints-modus-operandi.md` |
| ADR-049 | Tag obligatorio antes de siguiente sprint | Accepted | `ADR-049-tag-obligatorio-antes-siguiente-sprint.md` |
| ADR-050 | Cajas con dimensiones contables-fiscales | Accepted | `ADR-050-cajas-dimensionadas.md` |
| ADR-051 | Resolucion contextual de cuentas via tipo_uso | Accepted | `ADR-051-resolucion-contextual-cuentas.md` |
| ADR-052 | Conciliacion bancaria con auto-match sign-aware | Accepted | `ADR-052-conciliacion-bancaria-sign-aware.md` |

## ADRs 053+ (Tramo 4 Hardening)

| ADR | Titulo | Status | Archivo |
|---|---|---|---|
| ADR-053 | E2E tests excluidos de CI | Accepted | `ADR-053-e2e-no-en-ci.md` |

## ADRs 054-061 (FASE B + Bloque B12)

| ADR | Titulo | Status | Archivo |
|---|---|---|---|
| ADR-054 | Combobox autosuggest para entidades externas | Accepted | `ADR-054-combobox-autosuggest.md` |
| ADR-055 | Capabilities multivertical para SaaS Modular | Accepted | `ADR-055-capabilities-multivertical.md` |
| ADR-056 | Navegacion 3 niveles 4 espacios | Accepted | `ADR-056-navegacion-3-niveles-4-espacios.md` |
| ADR-057 | Navegacion universal acciones condicionales | Accepted | `ADR-057-navegacion-universal-acciones-condicionales.md` |
| ADR-058 | Correccion sidebar catalog completo | Accepted | `ADR-058-correccion-sidebar-catalog-completo.md` |
| ADR-060 | Sidebar 3 capas estado | Accepted | `ADR-060-sidebar-3-capas-estado.md` |
| ADR-061 | Drift TS-BD silenciado por Supabase client | Accepted | `ADR-061-drift-ts-bd-silenciado-supabase.md` |
