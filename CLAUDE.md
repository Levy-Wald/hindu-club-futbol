# CLAUDE.md — Instrucciones para el agente

## Estado actual

- **Tag actual:** `v0.9.0-fase3-sprint1` (2026-05-12)
- **FASE 1 cerrada**, Foundation (15a-c) cerrada, **FASE 2 cerrada**, FASE 3 iniciada (Sprint 3.1 cerrado)
- **Proximo sprint:** FASE 3.2 (por definir)
- **DB:** 146 tablas, 361 RLS policies, 130 funciones, 28 vistas, 94 triggers
- **UI:** 65 paginas, ~162 server actions, ~121 componentes custom
- **Tests E2E:** 36 specs (35 pass, 1 skip, 0 fail)
- **Hindu:** 2,390 personas, 7 equipos, 61 com_envios, 18 plantillas sistema, 36+ modulos activos
- **Arquitectura:** 3 capas — Troncal universal + 19 Modulos componibles + Verticales como presets (ADR-031)
- **39 ADRs** documentados (001-039)

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
npm run validate:all    # tsc + build + e2e (gate de cierre de sprint)
npm run build           # Next.js build
npx tsc --noEmit        # Type check
npm run test:e2e        # Playwright E2E tests contra produccion
npm run lint            # ESLint (79 errores heredados, no incluido en validate:all)
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
