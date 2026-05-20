# CLAUDE.md — Instrucciones para el agente

## Estado actual

- **Tag actual:** `v0.30.15-fix-b12-feedback` (2026-05-19)
- **Tags vigentes:** v0.29.0 (FASE A), v0.30.0 (FASE B), v0.30.5 (Tramo 4), v0.30.14 (B12.3), v0.30.15 (B12.4/fix feedback)
- **FASE 1-5 cerradas**, **FASE A COMPLETA**, **FASE B COMPLETA** (B1-B6 DONE)
- **Tramo 2 (Hardening) CERRADO** (H1-H4 DONE)
- **Tramo 4 (Hardening post-B) CERRADO** (H5-H7 DONE)
- **B7-FIX a B12.4 CERRADOS** (smoke fixes + capabilities + nav + sidebar 103 items + feedback fixes)
- **Proximo:** FASE C — Demo a Hindu (validacion humana, 0h Code)
- **DB:** 170+ tablas, 401 RLS policies, 137 funciones, 28 vistas, 102 triggers, 25 modulos roadmap
- **UI:** 96 paginas, ~215 server actions, ~196 componentes custom, 103 sidebar items, 5 espacios
- **Tests E2E:** 102+ specs (Playwright), 65 unit tests (Vitest)
- **CI:** GitHub Actions (lint + typecheck + unit + build)
- **Hindu:** 2,390 personas, 7 equipos, 61 com_envios, 18 plantillas sistema, 42+ modulos activos
- **Arquitectura:** 4 capas — Troncal + Cross-vertical + Vertical + Conectores (RFC-004)
- **60+ ADRs** documentados (001-060+)

## Bloqueos operativos vigentes

Estos items NO estan disponibles y NO deben asumirse como funcionales:

- **Resend:** sin API key, sin dominio verificado. Emails en modo mock (ADR-035)
- **MercadoPago:** sin credenciales empresa. Cobros en modo mock
- **CUIT / datos fiscales Hindu:** no disponibles. AFIP postergado
- **Dominios Hindu:** sin acceso DNS. SPF/DKIM/DMARC pendientes post-demo
- **Mails institucionales Hindu:** no disponibles. Se usan mails personales

Todo servicio externo opera en modo mock-first universal (ADR-035).
El switch a produccion real se centraliza en FASE 16 (post-demo).

## Lectura obligatoria antes de cualquier cambio

1. `/docs/MASTER-PROJECT.md` — Modelo de datos y reglas fundamentales
2. `/docs/CURRENT-STATE.md` — Inventario real del proyecto
3. `/docs/ARCHITECTURE.md` — Convenciones tecnicas, patrones, anti-patrones
4. `/docs/SPRINT-PLAN.md` — Sprint actual y cola
5. `/docs/PROMPT-ENVELOPE.md` — Reglas del prompt (R-PE1 a R-PE10)
6. `/docs/ROADMAP.md` — 17 fases ordenadas por dependencias
7. `/docs/GLOSSARY.md` — Definiciones canonicas

Drive del proyecto: https://drive.google.com/drive/folders/10cjNwByn0wzcs1ibn4p6ZvZC2Xxau4Gv

## Comandos principales

```bash
pnpm run build          # Next.js build (gate de cierre de sprint)
pnpm tsc --noEmit       # Type check
pnpm run test:e2e       # Playwright E2E tests contra produccion
pnpm run test:unit      # Vitest unit tests
pnpm run lint           # ESLint
```

## Principios arquitectonicos

1. **Multi-tenancy estricto:** RLS en todas las tablas operativas + filtro en codigo
2. **Mock-first universal (ADR-035):** todo servicio externo en mock hasta demo aprobada
3. **Fuente unica de verdad:** ADR-024, roles en `personas_equipos.rol_equipo_slug`
4. **Audit log obligatorio** en datos sensibles (salud, credenciales)
5. **Idempotencia** en operaciones criticas (emisiones, imports, apply)
6. **Snapshot al momento** (no recalculo): canon guardado por venta, plantel guardado por solicitud
7. **Pre-mortem (R-PE9)** para sprints de alto riesgo
8. **Aislamiento financiero (ADR-025):** ventas de concesionarios NO tocan movimientos_caja
9. **Server actions para mutaciones, API routes solo query-only**

## Aprendizajes canonizados (FASE 2)

Errores recurrentes detectados durante FASE 2 que están ahora
canonizados como ADRs. Code consulta antes de cada sprint:

- **ADR-036** — Permission slugs SIEMPRE en dot-notation
  (`tenant.admin`, no `admin_tenant`). Validar contra catalogo_atributos.
- **ADR-037** — Data que se filtra frecuentemente vive en columnas
  nativas, no en metadata jsonb. Antes de agregar a metadata,
  evaluar si necesita filtros, joins o índice.
- **ADR-038** — Sprints que tocan triggers/jobs/flujos asincrónicos
  requieren al menos 1 E2E real con fixture + asserts en DB +
  cleanup garantizado con try/finally. Tests cosméticos no alcanzan.

Ver detalles completos en /docs/DECISIONS.md.

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
- **Server actions:** `camelCase` en `modules/<slug>/lib/actions.ts` o `_actions.ts` (troncal)
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

## Verificacion de produccion

**NUNCA afirmar el estado de un servicio en produccion sin haberlo
verificado via el MCP correspondiente.**

Tu build local, tu `vercel deploy` CLI, tu `npm run build`, tu `curl
localhost` NO son produccion. Son tu entorno local.

Para verificar produccion, usar:
- **Vercel deploys** -> MCP `claude.ai Vercel` (tool `list_deployments`)
- **Supabase DB** -> MCP `claude.ai Supabase` (tool `execute_sql`)
- **Paginas web de Vercel** -> MCP `claude.ai Vercel` (tool
  `web_fetch_vercel_url`)

Si un MCP no responde o no esta disponible, declarar explicitamente
"estado de X no verificado via MCP" en el reporte de cierre. No
inferir el estado a partir de tu CLI local. Esto se canoniza en
ADR-039.

Patron observado 2 veces (Sprint 2.4-FIX y Sprint 3.1) y prohibido
desde DOCS-5: reportar "Vercel deploy ERROR" cuando via MCP el deploy
esta READY. Cero tolerancia.

## Glosario rapido

Ver `/docs/GLOSSARY.md` para definiciones completas. Terminos clave:
persona (no usuario), atributo (no rol), tenant (no cliente), emision
(no facturacion), concesionario (aislado del plan de cuentas), canon
(comision mensual), plantel snapshot (captura al momento), mock-first
(ADR-035, todo en mock hasta demo), lote (grupo de envios masivos),
segmento (filtro de personas para envio masivo).

## Modelo operativo Yair / Arquitecto

Canonizado el 12-may-2026. Define quién decide qué en el proyecto.

### Roles

- **Yair Levy Wald:** dueño de producto. Decide visión, scope,
  modelo de negocio, aprobación de RFCs, cambios estructurales,
  decisiones legales/comerciales.
- **Arquitecto (Claude Opus en chat web):** orquestador técnico.
  Decide orden de sprints, alcance, modelo de datos, patrones de
  código, naming, tests, anti-patrones, renumeraciones internas,
  ADRs menores. Verifica producción vía MCP en cada cierre.
- **Implementador (Claude Code en CLI):** ejecuta los prompts que
  arma el arquitecto. Reporta cierre con formato canonizado
  (R-PE10). NUNCA afirma estado de producción sin verificar vía
  MCP (ADR-039, AP-001, AP-002).

### Qué decide el Arquitecto sin consultar

- Orden de sprints (respetando dependencias del RFC vigente)
- Tamaño y alcance de cada sprint
- Modelo de datos (tablas, columnas, índices, RLS)
- Patrones de código y naming
- Cómo testear (E2E vs unit, con o sin fixture)
- Si requiere pre-mortem (R-PE9)
- Renumeración cuando hay desincronización docs
- Anti-patrones (AP-NNN) y ADRs menores
- Cuándo cortar el día y cuándo seguir

### Qué requiere validación de Yair

- Visión de producto / scope macro
- Modelo de negocio
- Roadmap a alto nivel (fases nuevas, repriorización)
- Aprobación de RFCs antes del sprint asociado
- Decisiones legales / comerciales / contractuales
- Cuando hay 2+ opciones con tradeoff serio
- Reasignaciones de roles / responsabilidades

### Disciplinas operativas no opcionales

1. Envelope canónico (R-PE1 a R-PE10) en cada prompt
2. Verificación vía MCP antes/después de cada sprint
3. Pre-mortem si sprint grande/riesgoso (R-PE9)
4. Docs vivos actualizados en CADA sprint
5. ADRs para decisiones que el equipo debe conocer
6. Anti-patrones AP-NNN cuando bug en prod enseña algo
7. RFCs antes de sprints grandes o sistemas nuevos
8. Cierre ejecutivo al Drive en días significativos

Detalles operativos en `docs/RUNBOOK.md` sección "Modelo operativo".
