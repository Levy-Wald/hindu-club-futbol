# CLAUDE.md — Instrucciones para el agente

## Estado actual

- **FASE 1 cerrada** (tag `v0.1.0-fase1-cierre`, 2026-05-11)
- **Foundation declarativa** (Sprint 15a): ADRs 031-033, 18 manifiestos, 3 capas formalizadas
- **DB:** 116 tablas, 355 RLS policies, 126 funciones, 28 vistas, 97 triggers
- **UI:** 64 paginas, ~160 server actions, ~115 componentes custom
- **Hindu:** 2,389 personas, 7 equipos, 51 suscripciones, 35+ modulos activos
- **Arquitectura:** 3 capas — Troncal universal + 18 Modulos componibles + Verticales como presets (ADR-031)

## Lectura obligatoria antes de cualquier cambio

1. `/docs/MASTER-PROJECT.md` — Modelo de datos y reglas fundamentales
2. `/docs/CURRENT-STATE.md` — Inventario real del proyecto
3. `/docs/ARCHITECTURE.md` — Convenciones tecnicas, patrones, anti-patrones
4. `/docs/SPRINT-PLAN.md` — Sprint actual y cola
5. `/docs/PROMPT-ENVELOPE.md` — Reglas del prompt (R-PE1 a R-PE9)
6. `/docs/ROADMAP.md` — 17 fases ordenadas por dependencias
7. `/docs/GLOSSARY.md` — Definiciones canonicas

## Principios arquitectonicos

1. **Multi-tenancy estricto:** RLS en todas las tablas operativas + filtro en codigo
2. **Mock/sandbox/production:** todo servicio externo en mock hasta demo aprobada
3. **Fuente unica de verdad:** ADR-024, roles en `personas_equipos.rol_equipo_slug`
4. **Audit log obligatorio** en datos sensibles (salud, credenciales)
5. **Idempotencia** en operaciones criticas (emisiones, imports, apply)
6. **Snapshot al momento** (no recalculo): canon guardado por venta, plantel guardado por solicitud
7. **Pre-mortem (R-PE9)** para sprints de alto riesgo
8. **Aislamiento financiero (ADR-025):** ventas de concesionarios NO tocan movimientos_caja

## Roles operativos

- **Arquitecto** (chat web Claude): diseno, decisiones, ADRs, specs de sprint
- **Code** (CLI Claude Code): implementacion segun specs, actualiza CURRENT-STATE
- **Yair**: dueno operativo, decide producto, aprueba cambios estructurales

## Naming conventions

- **Tablas:** `snake_case`, plural. Modulos con prefijo: `rrhh_*`, `com_*`, `utl_*`, `concesion_*`
- **Funciones SQL:** `fn_` para operaciones, `sync_` para sincronizadores, `trg_` para triggers
- **Vistas:** prefijo `v_`
- **Atributos en catalogo:** `snake_case`
- **Migrations:** `YYYYMMDD_descripcion_snake.sql`
- **Server actions:** `camelCase` en `_actions.ts`
- **Componentes:** `PascalCase` en archivos `kebab-case.tsx`

## Reglas de operacion

- Toda solicitud respeta `PROMPT-ENVELOPE.md`
- Al terminar cualquier cambio, actualizar `CURRENT-STATE.md`
- Cambios estructurales (modelos, capas) requieren aprobacion del arquitecto
- UI: botones siempre arriba, mobile-first, shadcn v4 con `render` prop
- PostgREST FK joins devuelven arrays: usar `as unknown as Type`
- `TENANT_ID = '11111111-1111-1111-1111-111111111111'` (hardcoded dev)
- Auth: usar `getUser()` no `getSession()` en layouts/pages (migrado en Sprint 14k.8)
- Trigger: `trg_set_updated_at()` (NO `set_updated_at()`)
- `catalogo_modulos.activo_global` (NO `.activo`)

## Glosario rapido

Ver `/docs/GLOSSARY.md` para definiciones completas. Terminos clave:
persona (no usuario), atributo (no rol), tenant (no cliente), emision
(no facturacion), concesionario (aislado del plan de cuentas), canon
(comision mensual), plantel snapshot (captura al momento).
