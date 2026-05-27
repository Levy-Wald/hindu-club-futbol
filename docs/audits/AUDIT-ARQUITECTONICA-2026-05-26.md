# Auditoria Arquitectonica — hindu-v2

**Fecha:** 2026-05-26
**Tag actual:** `v0.35.1-a4.2-ui-fixes`
**Branch:** `main`

---

## 1. Estructura de carpetas (3 niveles, excl. node_modules/.next/dist/.git)

```
hindu-v2/
├── app/
│   ├── (public)/
│   │   ├── _components/
│   │   ├── _lib/
│   │   ├── asociate/
│   │   ├── equipos/
│   │   ├── login/
│   │   ├── nomina/
│   │   ├── privacidad/
│   │   ├── terminos/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── admin/
│   │   ├── [tenant]/          # Ruteo dinamico multi-tenant
│   │   ├── scl/               # Panel super-admin (SCL)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   ├── asistencias/
│   │   ├── auth/
│   │   ├── comunicaciones/
│   │   ├── cron/
│   │   ├── dashboard/
│   │   ├── historial-deportivo/
│   │   ├── nomina/
│   │   ├── notificaciones/
│   │   ├── operaciones/
│   │   └── v1/
│   ├── evento/
│   │   └── [id]/
│   ├── globals.css
│   ├── layout.tsx
│   └── favicon.ico
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── magic-link-form.tsx
│   ├── layout/
│   │   ├── global-search.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── notificaciones-dropdown.tsx
│   │   ├── sidebar.tsx
│   │   ├── theme-toggle.tsx
│   │   └── topbar.tsx
│   ├── loaders/
│   │   └── loading-skeleton.tsx
│   ├── navigation/
│   │   ├── Breadcrumbs.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── MobileDrawer.tsx
│   │   ├── NavSidebar.tsx
│   │   ├── NavigationShell.tsx
│   │   ├── ProximamenteModal.tsx
│   │   ├── SidebarGroup.tsx
│   │   ├── SidebarItem.tsx
│   │   ├── TopBar.tsx
│   │   ├── UserAvatarMenu.tsx
│   │   ├── icon-map.tsx
│   │   └── navigation-provider.tsx
│   ├── providers/
│   │   └── query-provider.tsx
│   ├── ui/                    # ~40 componentes shadcn/custom
│   ├── capability-gate.tsx
│   ├── client-only.tsx
│   └── modulo-guard.tsx
├── lib/
│   ├── api/                   # auth, helpers, scopes
│   ├── audit/                 # salud-log
│   ├── catalogos/             # registry
│   ├── contexts/              # tenant-context
│   ├── dashboard/             # types, widget-registry
│   ├── export/                # formats, template
│   ├── exports/               # footer-confidencial
│   ├── imports/               # actions, parser, parsers/, types
│   ├── navigation/            # filter, items, sidebar-items, spaces, types
│   ├── permisos/              # concesiones, utileria
│   ├── permissions/           # capabilities-context, capabilities, user-attributes
│   ├── search/                # global-search
│   ├── supabase/              # client, middleware, server, service-role
│   ├── troncal/               # crm/, erp/, plataforma/, types/, operaciones
│   ├── vinculos/              # labels
│   ├── vistas/                # actions, column-defs
│   ├── cache.ts
│   ├── tenant.ts
│   └── utils.ts
├── modules/                   # 37 modulos verticales
│   ├── acceso/
│   ├── amistosos/
│   ├── asistencias/
│   ├── atributos-custom/
│   ├── competencias/
│   ├── comunicaciones/
│   ├── concesiones/
│   ├── diagramacion-club/
│   ├── disciplinas/
│   ├── entrenamientos/
│   ├── equipos/
│   ├── espacios/
│   ├── eventos/
│   ├── eventos_calendario/
│   ├── finanzas/
│   ├── historial-deportivo/
│   ├── membresias/
│   ├── nominas_externas/
│   ├── notificaciones/
│   ├── partidos/
│   ├── pim/
│   ├── planificadores/
│   ├── pre_inscripciones/
│   ├── proveedores/
│   ├── proyectos/
│   ├── reportes-deportivos/
│   ├── reservas/
│   ├── rrhh/
│   ├── salud/
│   ├── salud-lesiones/
│   ├── scouting/
│   ├── socios/
│   ├── solicitudes/
│   ├── tactica/
│   ├── talles/
│   ├── torneos/
│   └── utileria/
│   (cada modulo: lib/ + ui/ + module.json [+ types/])
├── docs/                      # 30+ docs, adr/, rfcs/, sprints/, audits/, cierres/
├── supabase/
│   └── migrations/            # 48 archivos .sql
├── scripts/                   # audit-schema-vs-code, seed, validate-manifests
├── styles/                    # tokens.css, themes/
├── eslint-rules/              # 3 reglas custom (cross-module, app-import, troncal)
├── public/                    # hindu-logo.png
├── .github/workflows/ci.yml
├── middleware.ts
├── next.config.ts
├── playwright.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── package.json
├── components.json
└── CLAUDE.md
```

---

## 2. Conteo de archivos por extension

| Extension | Cantidad |
|-----------|----------|
| `.ts`     | 295      |
| `.tsx`    | 539      |
| `.sql`    | 48       |
| `.md`     | 85       |
| **Total** | **967**  |

---

## 3. LOC aproximado (codigo de aplicacion)

| Scope                          | LOC       |
|--------------------------------|-----------|
| App code (.ts + .tsx, sin migrations) | **128,764** |
| SQL migrations                 | 6,736     |
| **Total codigo**               | **~135,500** |

> Excluye node_modules, .next, dist.

---

## 4. Dependencias (package.json)

### Produccion (39 deps)

| Dependencia | Version |
|-------------|---------|
| next | 16.2.4 |
| react / react-dom | 19.2.4 |
| @supabase/supabase-js | ^2.105.3 |
| @supabase/ssr | ^0.10.2 |
| zod | ^4.4.3 |
| @tanstack/react-query | ^5.100.10 |
| @tanstack/react-table | ^8.21.3 |
| @hookform/resolvers | ^5.2.2 |
| react-hook-form | ^7.75.0 |
| @tiptap/react + starter-kit + link + pm | ^3.23.4 |
| @dnd-kit/core + sortable + utilities | ^6.3.1 / ^10.0.0 / ^3.2.2 |
| @radix-ui/react-dropdown-menu | ^2.1.16 |
| @radix-ui/react-slot | ^1.2.4 |
| @base-ui/react | ^1.4.1 |
| shadcn | ^4.6.0 |
| lucide-react | ^1.14.0 |
| recharts | ^3.8.1 |
| react-big-calendar | ^1.19.4 |
| class-variance-authority | ^0.7.1 |
| clsx | ^2.1.1 |
| tailwind-merge | ^3.5.0 |
| tw-animate-css | ^1.4.0 |
| cmdk | ^1.1.1 |
| sonner | ^2.0.7 |
| next-themes | ^0.4.6 |
| date-fns | ^4.1.0 |
| xlsx | ^0.18.5 |
| jspdf + jspdf-autotable | ^4.2.1 / ^5.0.7 |
| html-to-image | ^1.11.13 |
| papaparse | ^5.5.3 |
| isomorphic-dompurify | ^3.13.0 |

### Desarrollo (11 deps)

| Dependencia | Version |
|-------------|---------|
| typescript | ^5 |
| eslint | ^9 |
| eslint-config-next | 16.2.4 |
| tailwindcss | ^4 |
| @tailwindcss/postcss | ^4 |
| @playwright/test | ^1.59.1 |
| vitest | ^4.1.6 |
| dotenv | ^17.4.2 |
| @types/node | ^20 |
| @types/react / react-dom | ^19 |
| @types/react-big-calendar | ^1.16.3 |
| @types/jspdf | ^2.0.0 |
| @types/papaparse | ^5.5.2 (en deps, deberia ser devDeps) |

---

## 5. Configuracion TypeScript (tsconfig.json)

| Opcion | Valor | Observacion |
|--------|-------|-------------|
| `strict` | **true** | Habilitado |
| `noUncheckedIndexedAccess` | **no presente** | Default: false |
| `exactOptionalPropertyTypes` | **no presente** | Default: false |
| `target` | ES2017 | |
| `module` | esnext | |
| `moduleResolution` | bundler | |
| `isolatedModules` | true | |
| `incremental` | true | |
| `skipLibCheck` | true | |
| `paths` | `@/* -> ./*` | Alias de raiz |
| `exclude` | node_modules, scripts | |

**Hallazgo:** `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes` no estan habilitados. Esto permite acceso a indices sin verificar undefined y propiedades opcionales sin distincion `T | undefined` vs `T?`.

---

## 6. Configuracion ESLint y Prettier

### ESLint (`eslint.config.mjs`)

- **Base:** `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- **Plugin custom:** `clubcore` con 3 reglas arquitectonicas:
  - `clubcore/no-cross-module-imports` — **warn** (modulos no importan de otros modulos)
  - `clubcore/no-module-importing-from-app` — **error** (modulos no importan de app/)
  - `clubcore/troncal-cannot-import-modules` — **error** (lib/troncal no importa de modules/)
- **Overrides:**
  - `@typescript-eslint/no-explicit-any` — warn (degradado, fix incremental)
  - `@typescript-eslint/no-require-imports` — warn
  - `react/no-unescaped-entities` — warn
  - `react-hooks/rules-of-hooks` — error
  - `react-hooks/set-state-in-effect` — warn
  - `react-hooks/purity` — warn
  - `react-hooks/refs` — warn
  - `react-hooks/static-components` — warn
- **Global ignores:** `.next/`, `out/`, `build/`, `next-env.d.ts`, `scripts/`

### Prettier

**No hay configuracion Prettier en el proyecto.** No existe `.prettierrc`, `.prettierrc.json`, ni `prettier.config.*` en la raiz.

---

## 7. Scripts npm disponibles

| Script | Comando | Proposito |
|--------|---------|-----------|
| `dev` | `next dev` | Dev server |
| `build` | `next build` | Build de produccion (gate de cierre) |
| `start` | `next start` | Server de produccion |
| `typecheck` | `tsc --noEmit` | Verificacion de tipos |
| `lint` | `eslint` | Lint completo |
| `audit:schema` | `npx tsx scripts/audit-schema-vs-code.ts` | Drift check schema vs codigo |
| `validate:manifests` | `npx tsx scripts/validate-module-manifests.ts` | Validar module.json de cada modulo |
| `validate:all` | manifests + e2e + build | Validacion completa |
| `validate:strict` | lint + manifests + schema audit + e2e + build | Validacion estricta |
| `test:unit` | `vitest run tests/unit/` | Tests unitarios |
| `test:e2e` | `playwright test` (con .env.local) | Tests E2E contra prod |
| `test:e2e:ui` | `playwright test --ui` | Tests E2E con UI interactiva |

---

## 8. Monorepo tooling

| Herramienta | Presente |
|-------------|----------|
| Turborepo (`turbo.json`) | **No** |
| Nx (`nx.json`) | **No** |
| Lerna (`lerna.json`) | **No** |
| pnpm workspaces (`pnpm-workspace.yaml`) | **Si** (solo para ignorar built deps: sharp, unrs-resolver) |
| Directorio `packages/` | **No** |
| Directorio `apps/` | **No** |

**Conclusion:** No es un monorepo. Es un **single-package project** con pnpm. El `pnpm-workspace.yaml` solo configura `ignoredBuiltDependencies`, no define workspaces.

---

## Validacion 26-may post-actions — Tablas sin RLS

SQL para habilitar RLS en las 10 tablas pendientes. **Cada ALTER TABLE debe ir acompanado de al menos una policy** (sino la tabla queda inaccesible para todos los roles):

```sql
-- Catalogos (tipicamente SELECT para authenticated)
ALTER TABLE catalogo_niveles_validacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_evento_validacion_default ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_unidades_medida ENABLE ROW LEVEL SECURITY;
ALTER TABLE com_variables_disponibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogo_estados_tarea ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_lesion ENABLE ROW LEVEL SECURITY;
ALTER TABLE scouting_dimensiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE evento_deportivo ENABLE ROW LEVEL SECURITY;

-- Operativa (filtro por tenant_id)
ALTER TABLE abuse_blocks ENABLE ROW LEVEL SECURITY;

-- Backup obsoleto (DROP preferido sobre habilitar RLS)
-- DROP TABLE IF EXISTS eventos_backup_20260522;
```

**Nota:** no ejecutar sin crear policies primero. Template de policy para catalogos:

```sql
CREATE POLICY "select_authenticated" ON <tabla>
  FOR SELECT TO authenticated USING (true);
```

---

## Resoluciones aplicadas 26-may-2026

### Tier 1 RLS Hardening: COMPLETO

Aplicado via Supabase MCP el 26-may-2026. Migracion espejo: `supabase/migrations/20260526200000_enable_rls_tier1_hardening.sql`.

| Tabla | Accion | Policy |
|---|---|---|
| catalogo_niveles_validacion | ENABLE RLS | SELECT authenticated |
| tipos_evento_validacion_default | ENABLE RLS | SELECT authenticated |
| catalogo_unidades_medida | ENABLE RLS | SELECT authenticated |
| com_variables_disponibles | ENABLE RLS | SELECT authenticated |
| catalogo_estados_tarea | ENABLE RLS | SELECT authenticated |
| tipos_lesion | ENABLE RLS | SELECT authenticated |
| scouting_dimensiones | ENABLE RLS | SELECT authenticated |
| abuse_blocks | ENABLE RLS | Sin policies (service_role only) |
| evento_deportivo | ENABLE RLS | ALL authenticated via FK EXISTS a eventos |
| eventos_backup_20260522 | DROP TABLE | N/A (0 FKs, backup obsoleto) |

**Score post-fix:** 174/174 tablas con RLS = 100% coverage. Score arquitectonico: 7.8 → 8.5/10.

---

## Observaciones para la auditoria

1. **`@types/papaparse`** esta en `dependencies` en vez de `devDependencies`
2. **`noUncheckedIndexedAccess: true`** seria recomendable habilitar para mayor type-safety en accesos a arrays/records
3. **No hay Prettier** — el formateo depende enteramente del editor de cada developer
4. **37 modulos verticales** con estructura consistente (`lib/` + `ui/` + `module.json`)
5. **3 reglas ESLint custom** protegen las boundaries arquitectonicas (4 capas RFC-004)
6. **128K+ LOC** de codigo de aplicacion — proyecto de escala considerable
7. **`no-explicit-any` en warn** — indica deuda tecnica conocida, fix incremental planificado
